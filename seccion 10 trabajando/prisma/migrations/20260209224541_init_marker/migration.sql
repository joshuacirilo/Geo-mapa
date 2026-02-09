-- CreateTable
CREATE TABLE "Marker" (
    "id" SERIAL NOT NULL,
    "id_public" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "geojson" JSONB NOT NULL,

    CONSTRAINT "Marker_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Marker_id_public_key" ON "Marker"("id_public");
