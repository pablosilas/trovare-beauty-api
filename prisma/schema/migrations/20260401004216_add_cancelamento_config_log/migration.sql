-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "cancelamentoAteStatus" TEXT NOT NULL DEFAULT 'aberto',
ADD COLUMN     "cancelamentoPermitido" TEXT NOT NULL DEFAULT 'gerente';

-- CreateTable
CREATE TABLE "LogCancelamento" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "pedidoId" INTEGER NOT NULL,
    "canceladoPor" TEXT NOT NULL,
    "nomeUsuario" TEXT NOT NULL,
    "motivo" TEXT NOT NULL DEFAULT '',
    "itens" JSONB NOT NULL,
    "mesa" TEXT NOT NULL DEFAULT '',
    "total" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LogCancelamento_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "LogCancelamento" ADD CONSTRAINT "LogCancelamento_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
