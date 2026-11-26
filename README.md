This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Roles

| Rol | Qué puede hacer |
| --- | --- |
| `superadmin` | Crear usuarios con rol administrador (`/superadmin`) |
| `admin` | Único que puede crear bolsas y sus 3 responsables (`/admin`, `/crear`) |
| padres (familia) | Pagar sus cuotas (`/inicio`) |
| comité (responsables) | Proponer y aprobar retiros, ver los pagos de los padres (`/comite`) |

El superadmin se crea con `pnpm db:seed` (`SUPERADMIN_DNI` / `SUPERADMIN_PASSWORD`, por defecto `10000001` / `superadmin2026`). Aplica la migración con `pnpm prisma migrate deploy`.

## Getting Started

First, run the development server:

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
integrantes:
Erika Arias Bustos
Juan Diego Huanaco
Diego Bejarano
Jairo lajo
