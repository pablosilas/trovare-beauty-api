/*
  Warnings:

  - You are about to drop the column `createdAt` on the `Item` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Item" DROP COLUMN "createdAt",
ADD COLUMN     "estoque" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "estoqueMin" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "temEstoque" BOOLEAN NOT NULL DEFAULT false;
