import { listNeighborhoods } from '../services/neighborhoods.service.js'

export async function getNeighborhoods(req, res) {
  res.json(await listNeighborhoods())
}
