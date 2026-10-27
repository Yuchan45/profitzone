import { getSampleReport as findSampleReport } from '../services/sampleReport.service.js'

export function getSampleReport(req, res) {
  res.json(findSampleReport())
}
