const router = require('express').Router();
const pool = require('../db/pool');
const { auth, requireRole } = require('../middleware/auth');

const canEdit = (role) => ['wife', 'husband', 'admin'].includes(role);

// POST /api/observations - create or update an observation for a day
router.post('/', auth, async (req, res) => {
  if (!canEdit(req.user.role)) return res.status(403).json({ error: 'Forbidden' });

  const {
    cycle_id, day_number, obs_date,
    stamp_color, stamp_symbol,
    observation_number, observation_letters, observation_frequency,
    sensation, is_peak_day, is_menstruation, notes
  } = req.body;

  if (!cycle_id || !day_number || !obs_date || !stamp_color) {
    return res.status(400).json({ error: 'cycle_id, day_number, obs_date, stamp_color required' });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO observations
        (cycle_id, day_number, obs_date, stamp_color, stamp_symbol,
         observation_number, observation_letters, observation_frequency,
         sensation, is_peak_day, is_menstruation, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       ON CONFLICT (cycle_id, day_number) DO UPDATE SET
         obs_date = EXCLUDED.obs_date,
         stamp_color = EXCLUDED.stamp_color,
         stamp_symbol = EXCLUDED.stamp_symbol,
         observation_number = EXCLUDED.observation_number,
         observation_letters = EXCLUDED.observation_letters,
         observation_frequency = EXCLUDED.observation_frequency,
         sensation = EXCLUDED.sensation,
         is_peak_day = EXCLUDED.is_peak_day,
         is_menstruation = EXCLUDED.is_menstruation,
         notes = EXCLUDED.notes,
         updated_at = NOW()
       RETURNING *`,
      [
        cycle_id, day_number, obs_date,
        stamp_color, stamp_symbol || null,
        observation_number || null, observation_letters || null,
        observation_frequency || null,
        sensation || null,
        is_peak_day || false, is_menstruation || false,
        notes || null
      ]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/observations/:id
router.delete('/:id', auth, async (req, res) => {
  if (!canEdit(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
  try {
    const { rowCount } = await pool.query('DELETE FROM observations WHERE id = $1', [req.params.id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Observation not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/observations/:id/notes - practitioner adds a note
router.post('/:id/notes', auth, requireRole('practitioner', 'admin'), async (req, res) => {
  const { note } = req.body;
  if (!note) return res.status(400).json({ error: 'note required' });

  try {
    // Get cycle_id from observation
    const { rows: obsRows } = await pool.query(
      'SELECT cycle_id FROM observations WHERE id = $1', [req.params.id]
    );
    if (!obsRows[0]) return res.status(404).json({ error: 'Observation not found' });

    const { rows } = await pool.query(
      `INSERT INTO practitioner_notes (observation_id, cycle_id, practitioner_id, note)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [req.params.id, obsRows[0].cycle_id, req.user.id, note]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/cycles/:cycleId/notes - practitioner adds a cycle-level note
router.post('/cycle/:cycleId/notes', auth, requireRole('practitioner', 'admin'), async (req, res) => {
  const { note } = req.body;
  if (!note) return res.status(400).json({ error: 'note required' });

  try {
    const { rows } = await pool.query(
      `INSERT INTO practitioner_notes (cycle_id, practitioner_id, note)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [req.params.cycleId, req.user.id, note]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
