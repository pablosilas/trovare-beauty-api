import prisma, { booking, barber as barberModel } from "../prisma.js";

export async function list(req, res) {
  try {
    const bookings = await booking.findMany({
      where: { tenantId: req.tenantId },
      include: { client: true, barber: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(bookings);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

export async function create(req, res) {
  try {
    const { clientId, barberId, service, price, date, time, status } = req.body;

    const b = await booking.create({
      data: {
        tenantId: req.tenantId,
        clientId: Number(clientId),
        barberId: Number(barberId),
        service,
        price: Number(price),
        date,
        time,
        status,
      },
      include: { client: true, barber: true },
    });

    // cria comissão automaticamente
    const barberData = await barberModel.findUnique({
      where: { id: Number(barberId) },
    });

    await prisma.commission.create({
      data: {
        tenantId: req.tenantId,
        barberId: Number(barberId),
        bookingId: b.id,
        amount: (Number(price) * barberData.commissionPct) / 100,
      },
    });

    res.status(201).json(b);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

export async function update(req, res) {
  try {
    const { status } = req.body;
    const b = await booking.update({
      where: { id: Number(req.params.id), tenantId: req.tenantId },
      data: { status },
      include: { client: true, barber: true },
    });
    res.json(b);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

export async function remove(req, res) {
  try {
    await prisma.commission.deleteMany({
      where: { bookingId: Number(req.params.id), tenantId: req.tenantId },
    });
    await booking.delete({
      where: { id: Number(req.params.id), tenantId: req.tenantId },
    });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}