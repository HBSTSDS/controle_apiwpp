import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import jwt from 'jsonwebtoken';

export class AuthController {
  async registerCompany(req: Request, res: Response) {
    try {
      const { companyName, companyDocument, userName, userEmail, userPassword } = req.body;

      // Basic validation
      if (!companyName || !userName || !userEmail || !userPassword) {
        return res.status(400).json({ error: 'Preencha todos os campos obrigatórios' });
      }

      // Check if user already exists
      const userExists = await prisma.user.findUnique({ where: { email: userEmail } });
      if (userExists) {
        return res.status(400).json({ error: 'Email já cadastrado' });
      }

      // Start transaction to create Company and Admin User together
      const result = await prisma.$transaction(async (prisma) => {
        const company = await prisma.company.create({
          data: {
            name: companyName,
            document: companyDocument,
          },
        });

        const user = await prisma.user.create({
          data: {
            companyId: company.id,
            name: userName,
            email: userEmail,
            // TODO: In production, hash password with bcrypt
            passwordHash: userPassword,
            role: 'ADMIN',
          },
        });

        return { company, user };
      });

      return res.status(201).json({ message: 'Empresa registrada com sucesso!', companyId: result.company.id });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao registrar empresa' });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      const user = await prisma.user.findUnique({ where: { email } });

      // TODO: compare hashed passwords in production
      if (!user || user.passwordHash !== password) {
        return res.status(401).json({ error: 'Credenciais inválidas' });
      }

      const token = jwt.sign(
        { id: user.id, companyId: user.companyId, role: user.role },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '1d' }
      );

      return res.json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          companyId: user.companyId,
        },
        token,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao fazer login' });
    }
  }
}
