import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PageWrapper from '../components/PageWrapper';
import GlassCard from '../components/GlassCard';
import AnimatedButton from '../components/AnimatedButton';
import AnimatedInput from '../components/AnimatedInput';
import Loader from '../components/Loader';
import {
  getAllProfiles,
  updateProfile,
  getPlacements,
  createPlacement,
  updatePlacement,
  deletePlacement,
} from '../api';

const EMPTY_PLACEMENT = {
  company: '',
  role: '',
  job_field: '',
  languages: '',
  skills: '',
  package_lpa: '',
  location: '',
  drive_date: '',
};

function Modal({ onClose, children, title }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 26 }}
        onClick={(e) => e.stopPropagation()}
        className="glass-strong max-h-[90vh] w-full max-w-lg overflow-y-auto p-8"
      >
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-xl font-bold text-white">{title}</h3>
          <motion.button
            whileHover={{ rotate: 90, scale: 1.1 }}
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-300 hover:bg-white/10"
            aria-label="Close"
          >
            ✕
          </motion.button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
}

export default function LecturerDashboard() {
  // --- Students ---
  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [studentQuery, setStudentQuery] = useState('');
  const [editStudent, setEditStudent] = useState(null);
  const [studentSaving, setStudentSaving] = useState(false);

  // --- Placements ---
  const [placements, setPlacements] = useState([]);
  const [placementsLoading, setPlacementsLoading] = useState(true);
  const [placementForm, setPlacementForm] = useState(EMPTY_PLACEMENT);
  const [editingPlacementId, setEditingPlacementId] = useState(null);
  const [placementModalOpen, setPlacementModalOpen] = useState(false);
  const [placementSaving, setPlacementSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const [notice, setNotice] = useState('');
  const flash = (msg) => {
    setNotice(msg);
    setTimeout(() => setNotice(''), 3500);
  };

  const loadStudents = useCallback(async () => {
    setStudentsLoading(true);
    try {
      const data = await getAllProfiles();
      setStudents(Array.isArray(data) ? data : data.profiles || []);
    } catch (err) {
      flash(err?.response?.data?.detail || 'Failed to load students.');
    } finally {
      setStudentsLoading(false);
    }
  }, []);

  const loadPlacements = useCallback(async () => {
    setPlacementsLoading(true);
    try {
      const data = await getPlacements();
      setPlacements(Array.isArray(data) ? data : data.placements || []);
    } catch (err) {
      flash(err?.response?.data?.detail || 'Failed to load placements.');
    } finally {
      setPlacementsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStudents();
    loadPlacements();
  }, [loadStudents, loadPlacements]);

  const filteredStudents = students.filter((s) => {
    const q = studentQuery.toLowerCase();
    return (
      !q ||
      s.full_name?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q) ||
      s.target_job_field?.toLowerCase().includes(q)
    );
  });

  // --- Student edit ---
  const openStudentEdit = (s) => {
    setEditStudent({
      id: s.id,
      full_name: s.full_name || '',
      year_of_study: s.year_of_study || 1,
      target_job_field: s.target_job_field || '',
      leetcode_username: s.leetcode_username || '',
      campus_track_username: s.campus_track_username || '',
      status: s.status || 'active',
    });
  };

  const saveStudent = async (e) => {
    e.preventDefault();
    setStudentSaving(true);
    try {
      await updateProfile(editStudent.id, {
        full_name: editStudent.full_name,
        year_of_study: Number(editStudent.year_of_study),
        target_job_field: editStudent.target_job_field || null,
        leetcode_username: editStudent.leetcode_username.trim() || null,
        campus_track_username: editStudent.campus_track_username.trim() || null,
        status: editStudent.status,
      });
      setEditStudent(null);
      await loadStudents();
      flash('Student updated ✓');
    } catch (err) {
      flash(err?.response?.data?.detail || 'Update failed.');
    } finally {
      setStudentSaving(false);
    }
  };

  // --- Placement CRUD ---
  const openPlacementModal = (p = null) => {
    if (p) {
      setEditingPlacementId(p.id);
      setPlacementForm({
        company: p.company || '',
        role: p.role || '',
        job_field: p.job_field || '',
        languages: (p.languages || []).join(', '),
        skills: (p.skills || []).join(', '),
        package_lpa: p.package_lpa || '',
        location: p.location || '',
        drive_date: p.drive_date || '',
      });
    } else {
      setEditingPlacementId(null);
      setPlacementForm(EMPTY_PLACEMENT);
    }
    setPlacementModalOpen(true);
  };

  const savePlacement = async (e) => {
    e.preventDefault();
    setPlacementSaving(true);
    try {
      const payload = {
        company: placementForm.company,
        role: placementForm.role,
        job_field: placementForm.job_field || null,
        languages: placementForm.languages.split(',').map((s) => s.trim()).filter(Boolean),
        skills: placementForm.skills.split(',').map((s) => s.trim()).filter(Boolean),
        package_lpa: placementForm.package_lpa ? Number(placementForm.package_lpa) : null,
        location: placementForm.location || null,
        drive_date: placementForm.drive_date || null,
      };
      if (editingPlacementId) {
        await updatePlacement(editingPlacementId, payload);
        flash('Placement updated ✓');
      } else {
        await createPlacement(payload);
        flash('Placement added ✓');
      }
      setPlacementModalOpen(false);
      await loadPlacements();
    } catch (err) {
      flash(err?.response?.data?.detail || 'Save failed.');
    } finally {
      setPlacementSaving(false);
    }
  };

  const confirmDelete = async () => {
    try {
      await deletePlacement(deleteId);
      setDeleteId(null);
      await loadPlacements();
      flash('Placement deleted ✓');
    } catch (err) {
      flash(err?.response?.data?.detail || 'Delete failed.');
    }
  };

  const statusColor = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'placed': return 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30';
      case 'active': return 'bg-cyan-500/20 text-cyan-200 border-cyan-400/30';
      case 'inactive': return 'bg-slate-500/20 text-slate-300 border-slate-400/30';
      default: return 'bg-violet-500/20 text-violet-200 border-violet-400/30';
    }
  };

  return (
    <PageWrapper>
      <main className="mx-auto max-w-7xl px-4 pb-16 pt-28">
        <AnimatePresence>
          {notice && (
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="glass mb-6 border-cyan-400/30 p-4 text-center text-sm font-medium text-cyan-200"
            >
              {notice}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-extrabold text-white"
        >
          Lecturer <span className="text-gradient">Console</span> 👩‍🏫
        </motion.h1>

        {/* Students table */}
        <GlassCard delay={0.1} className="mt-8 overflow-hidden p-0">
          <div className="flex flex-wrap items-center justify-between gap-3 p-6 pb-4">
            <h2 className="text-lg font-bold text-white">🎓 Students ({filteredStudents.length})</h2>
            <input
              value={studentQuery}
              onChange={(e) => setStudentQuery(e.target.value)}
              placeholder="Search students…"
              className="w-full max-w-xs rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm text-white placeholder-slate-400 backdrop-blur-xl outline-none focus:border-violet-400"
            />
          </div>
          {studentsLoading ? (
            <Loader label="Loading students…" />
          ) : filteredStudents.length === 0 ? (
            <p className="p-6 pt-2 text-sm text-slate-400">No students found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead>
                  <tr className="border-y border-white/10 text-xs uppercase tracking-wider text-slate-400">
                    {['Name', 'Email', 'Year', 'Target field', 'LeetCode solved', 'Status', ''].map((h) => (
                      <th key={h} className="px-6 py-3 font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {filteredStudents.map((s, i) => (
                      <motion.tr
                        key={s.id}
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: Math.min(i * 0.04, 0.6) }}
                        className="border-b border-white/5 transition-colors hover:bg-white/5"
                      >
                        <td className="px-6 py-3.5 font-semibold text-white">{s.full_name}</td>
                        <td className="px-6 py-3.5 text-slate-300">{s.email}</td>
                        <td className="px-6 py-3.5 text-slate-300">{s.year_of_study ? `Y${s.year_of_study}` : '—'}</td>
                        <td className="px-6 py-3.5 text-slate-300">{s.target_job_field || '—'}</td>
                        <td className="px-6 py-3.5">
                          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-cyan-200">
                            {s.leetcode_total_solved ?? s.total_solved ?? '—'}
                          </span>
                        </td>
                        <td className="px-6 py-3.5">
                          <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusColor(s.status)}`}>
                            {s.status || 'active'}
                          </span>
                        </td>
                        <td className="px-6 py-3.5">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => openStudentEdit(s)}
                            className="rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/15"
                          >
                            Edit
                          </motion.button>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
        </GlassCard>

        {/* Placements manager */}
        <GlassCard delay={0.15} className="mt-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-white">🏢 Placement Drives ({placements.length})</h2>
            <AnimatedButton onClick={() => openPlacementModal()} className="px-5 py-2.5 text-sm">
              + Add placement
            </AnimatedButton>
          </div>
          {placementsLoading ? (
            <Loader label="Loading placements…" />
          ) : placements.length === 0 ? (
            <p className="mt-4 text-sm text-slate-400">No placements yet. Add your first drive above.</p>
          ) : (
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {placements.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.06, 0.6) }}
                  className="rounded-2xl border border-white/15 bg-white/5 p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-white">{p.company}</p>
                      <p className="text-sm text-slate-300">{p.role}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        {[p.job_field, p.package_lpa ? `${p.package_lpa} LPA` : null, p.location, p.drive_date]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <motion.button
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.92 }}
                        onClick={() => openPlacementModal(p)}
                        className="rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/15"
                      >
                        Edit
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.92 }}
                        onClick={() => setDeleteId(p.id)}
                        className="rounded-lg border border-rose-400/40 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-200 hover:bg-rose-500/20"
                      >
                        Delete
                      </motion.button>
                    </div>
                  </div>
                  {(p.languages?.length > 0) && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {p.languages.map((l) => (
                        <span key={l} className="rounded-full bg-cyan-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-cyan-200">
                          {l}
                        </span>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </GlassCard>

        {/* Student edit modal */}
        <AnimatePresence>
          {editStudent && (
            <Modal onClose={() => setEditStudent(null)} title={`Edit — ${editStudent.full_name}`}>
              <form onSubmit={saveStudent} className="space-y-4">
                <AnimatedInput label="Full name" value={editStudent.full_name} onChange={(e) => setEditStudent({ ...editStudent, full_name: e.target.value })} required />
                <div className="grid grid-cols-2 gap-4">
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-medium text-slate-300">Year</span>
                    <select
                      value={editStudent.year_of_study}
                      onChange={(e) => setEditStudent({ ...editStudent, year_of_study: e.target.value })}
                      className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white outline-none [&>option]:bg-ink-900"
                    >
                      {[1, 2, 3, 4].map((y) => <option key={y} value={y}>Year {y}</option>)}
                    </select>
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-medium text-slate-300">Status</span>
                    <select
                      value={editStudent.status}
                      onChange={(e) => setEditStudent({ ...editStudent, status: e.target.value })}
                      className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white outline-none [&>option]:bg-ink-900"
                    >
                      {['active', 'inactive', 'placed'].map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </label>
                </div>
                <AnimatedInput label="Target job field" value={editStudent.target_job_field} onChange={(e) => setEditStudent({ ...editStudent, target_job_field: e.target.value })} />
                <AnimatedInput label="LeetCode username" value={editStudent.leetcode_username} onChange={(e) => setEditStudent({ ...editStudent, leetcode_username: e.target.value })} />
                <AnimatedInput label="Campus-track username" value={editStudent.campus_track_username} onChange={(e) => setEditStudent({ ...editStudent, campus_track_username: e.target.value })} />
                <div className="flex gap-3 pt-2">
                  <AnimatedButton type="button" variant="secondary" onClick={() => setEditStudent(null)} className="flex-1">Cancel</AnimatedButton>
                  <AnimatedButton type="submit" loading={studentSaving} className="flex-1">
                    {studentSaving ? 'Saving…' : 'Save'}
                  </AnimatedButton>
                </div>
              </form>
            </Modal>
          )}
        </AnimatePresence>

        {/* Placement add/edit modal */}
        <AnimatePresence>
          {placementModalOpen && (
            <Modal onClose={() => setPlacementModalOpen(false)} title={editingPlacementId ? 'Edit placement' : 'Add placement'}>
              <form onSubmit={savePlacement} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <AnimatedInput label="Company" value={placementForm.company} onChange={(e) => setPlacementForm({ ...placementForm, company: e.target.value })} required />
                  <AnimatedInput label="Role" value={placementForm.role} onChange={(e) => setPlacementForm({ ...placementForm, role: e.target.value })} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <AnimatedInput label="Job field" value={placementForm.job_field} onChange={(e) => setPlacementForm({ ...placementForm, job_field: e.target.value })} placeholder="SWE, Data Science…" />
                  <AnimatedInput label="Package (LPA)" type="number" value={placementForm.package_lpa} onChange={(e) => setPlacementForm({ ...placementForm, package_lpa: e.target.value })} />
                </div>
                <AnimatedInput label="Languages (comma separated)" value={placementForm.languages} onChange={(e) => setPlacementForm({ ...placementForm, languages: e.target.value })} placeholder="Python, SQL" />
                <AnimatedInput label="Skills (comma separated)" value={placementForm.skills} onChange={(e) => setPlacementForm({ ...placementForm, skills: e.target.value })} placeholder="React, System Design" />
                <div className="grid grid-cols-2 gap-4">
                  <AnimatedInput label="Location" value={placementForm.location} onChange={(e) => setPlacementForm({ ...placementForm, location: e.target.value })} />
                  <AnimatedInput label="Drive date" type="date" value={placementForm.drive_date} onChange={(e) => setPlacementForm({ ...placementForm, drive_date: e.target.value })} />
                </div>
                <div className="flex gap-3 pt-2">
                  <AnimatedButton type="button" variant="secondary" onClick={() => setPlacementModalOpen(false)} className="flex-1">Cancel</AnimatedButton>
                  <AnimatedButton type="submit" loading={placementSaving} className="flex-1">
                    {placementSaving ? 'Saving…' : editingPlacementId ? 'Save' : 'Add'}
                  </AnimatedButton>
                </div>
              </form>
            </Modal>
          )}
        </AnimatePresence>

        {/* Delete confirm */}
        <AnimatePresence>
          {deleteId && (
            <Modal onClose={() => setDeleteId(null)} title="Delete placement?">
              <p className="text-sm text-slate-300">This will permanently remove this placement drive. This can't be undone.</p>
              <div className="mt-6 flex gap-3">
                <AnimatedButton variant="secondary" onClick={() => setDeleteId(null)} className="flex-1">Cancel</AnimatedButton>
                <AnimatedButton variant="danger" onClick={confirmDelete} className="flex-1">Delete</AnimatedButton>
              </div>
            </Modal>
          )}
        </AnimatePresence>
      </main>
    </PageWrapper>
  );
}
