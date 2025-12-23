import { Router } from 'express';
import {
  getTickets,
  getTicket,
  createTicket,
  updateTicket,
  deleteTicket,
  getTicketStats,
} from '../controllers/ticketController';

const router = Router();

router.get('/', getTickets);
router.get('/stats', getTicketStats);
router.get('/:id', getTicket);
router.post('/', createTicket);
router.put('/:id', updateTicket);
router.delete('/:id', deleteTicket);

export default router;
