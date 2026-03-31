const router = require('express').Router();
const pool = require('../db/pool');
const { auth, requireRole } = require('../middleware/auth');

// Helpers: wife/husband/admin can edit; practitioner can read
const canEdit = (role) => ['wife', 'husband', 'admin'].includes(role);

// GET /api/cycles - list all cycles (all roles)
router.get('/', auth, async (req, res) => {
  try {
    let query, params;
    if (req.user.role === 'practitioner') {
      // Practitioners can see all cycles
      query = `
        SELECT c.*, u.name as owner_name
        FROM cycles c JOIN users u ON c.user_id = u.id
        ORDER BY c.start_date DESC
      `;
      params = [];
    } else {
      query = `
        SELECT c.*, u.name as owner_name
        FROM cycles c JOIN users u ON c.user_id = u.id
        ORDER BY c.start_date DESC
      `;
      params = [];
    }
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/cycles - create cycle (wife/husband/admin)
router.post('/', auth, async (req, res) => {
  if (!canEdit(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
  const { start_date, notes } = req.body;
  if (!start_date) return res.status(400).json({ error: 'start_date required' });
  try {
    // Auto-increment cycle_number for this user's family (use wife's user or shared pool)
    const { rows: countRows } = await pool.query(
      'SELECT COALESCE(MAX(cycle_number), 0) + 1 AS next FROM cycles'
    );
    const cycleNumber = countRows[0].next;
    const { rows } = await pool.query(
      'INSERT INTO cycles (user_id, cycle_number, start_date, notes) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.user.id, cycleNumber, start_date, notes || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/cycles/:id - get single cycle with observations
router.get('/:id', auth, async (req, res) => {
  try {
    const { rows: cycleRows } = await pool.query(
      'SELECT c.*, u.name as owner_name FROM cycles c JOIN users u ON c.user_id = u.id WHERE c.id = $1',
      [req.params.id]
    );
    if (!cycleRows[0]) return res.status(404).json({ error: 'Cycle not found' });

    const { rows: obsRows } = await pool.query(
      'SELECT * FROM observations WHERE cycle_id = $1 ORDER BY day_number',
      [req.params.id]
    );

    // Fetch practitioner notes for this cycle
    const { rows: noteRows } = await pool.query(
      `SELECT pn.*, u.name as practitioner_name
       FROM practitioner_notes pn JOIN users u ON pn.practitioner_id = u.id
       WHERE pn.cycle_id = $1 ORDER BY pn.created_at`,
      [req.params.id]
    );

    res.json({ cycle: cycleRows[0], observations: obsRows, practitionerNotes: noteRows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/cycles/:id - update cycle metadata
router.put('/:id', auth, async (req, res) => {
  if (!canEdit(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
  const { notes } = req.body;
  try {
    const { rows } = await pool.query(
      'UPDATE cycles SET notes = $1 WHERE id = $2 RETURNING *',
      [notes, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Cycle not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/cycles/:id
router.delete('/:id', auth, requireRole('admin', 'wife'), async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM cycles WHERE id = $1', [req.params.id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Cycle not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
