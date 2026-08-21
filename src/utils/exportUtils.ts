import { ExamSession, ViolationEvent } from '../types';

export function exportCandidateReportCSV(session: ExamSession): void {
  const headers = ['Metric', 'Value'];
  const rows = [
    ['Candidate Name', session.candidateName],
    ['Candidate Email', session.candidateEmail],
    ['Candidate ID', session.candidateId],
    ['Exam Title', session.examTitle],
    ['Exam Status', session.status.toUpperCase()],
    ['Integrity Score', `${session.integrityScore}%`],
    ['Total Score', `${session.score || 0} / ${session.totalPoints || 0} (${session.percentageScore || 0}%)`],
    ['Violations / Strikes', `${session.strikeCount} / ${session.maxStrikes}`],
    ['HR Decision', session.hrDecision?.toUpperCase() || 'PENDING REVIEW'],
    ['HR Reviewer', session.reviewedBy || 'N/A'],
    ['HR Notes', `"${(session.hrNotes || '').replace(/"/g, '""')}"`],
    ['Start Time', session.startTime || 'N/A'],
    ['End Time', session.endTime || 'N/A'],
    ['', ''],
    ['VIOLATION AUDIT TRAIL', ''],
    ['Timestamp', 'Type', 'Strike #', 'Severity', 'Details'],
  ];

  session.violations.forEach((v) => {
    rows.push([
      v.timestamp,
      v.type,
      `Strike ${v.strikeNumber}`,
      v.severity.toUpperCase(),
      `"${v.details.replace(/"/g, '""')}"`,
    ]);
  });

  const csvContent =
    'data:text/csv;charset=utf-8,' +
    rows.map((row) => row.map((cell) => `"${cell || ''}"`).join(',')).join('\n');

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `Proctoring_Report_${session.candidateName.replace(/\s+/g, '_')}_${session.id}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function printCandidateReport(session: ExamSession): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Proctoring Audit Dossier - ${session.candidateName}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 32px; color: #1e293b; background: #fff; }
    h1 { font-size: 22px; color: #0f172a; margin-bottom: 4px; }
    .subtitle { color: #64748b; font-size: 14px; margin-bottom: 24px; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
    .badge-approved { background: #dcfce7; color: #15803d; }
    .badge-rejected { background: #fee2e2; color: #b91c1c; }
    .badge-review { background: #fef3c7; color: #b45309; }
    .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 24px; }
    .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; }
    .card-label { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 600; }
    .card-val { font-size: 16px; font-weight: 600; color: #0f172a; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    th { text-align: left; background: #f1f5f9; padding: 10px; font-size: 12px; color: #475569; border-bottom: 2px solid #cbd5e1; }
    td { padding: 10px; font-size: 13px; border-bottom: 1px solid #e2e8f0; }
    .notes-box { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 14px; margin: 16px 0; font-size: 14px; }
    @media print { button { display: none; } }
  </style>
</head>
<body>
  <h1>Candidate Proctoring Forensic Audit Dossier</h1>
  <div class="subtitle">Exam: <strong>${session.examTitle}</strong> | Generated: ${new Date().toLocaleString()}</div>
  
  <div class="grid">
    <div class="card">
      <div class="card-label">Candidate Name & ID</div>
      <div class="card-val">${session.candidateName} (${session.candidateId})</div>
      <div style="font-size: 12px; color: #64748b; margin-top: 2px;">${session.candidateEmail}</div>
    </div>
    <div class="card">
      <div class="card-label">Proctoring Status & Decision</div>
      <div class="card-val">
        <span class="badge ${session.status === 'approved' ? 'badge-approved' : session.status === 'rejected' || session.status === 'terminated_strikes' ? 'badge-rejected' : 'badge-review'}">
          ${session.status.replace('_', ' ')}
        </span>
      </div>
    </div>
    <div class="card">
      <div class="card-label">Integrity Trust Index</div>
      <div class="card-val" style="color: ${session.integrityScore > 80 ? '#16a34a' : session.integrityScore > 50 ? '#d97706' : '#dc2626'}">
        ${session.integrityScore}%
      </div>
    </div>
    <div class="card">
      <div class="card-label">Violations / Total Strikes</div>
      <div class="card-val">${session.strikeCount} of ${session.maxStrikes} max allowed</div>
    </div>
  </div>

  ${session.hrNotes ? `<div class="notes-box"><strong>HR Recruiter Audit Note:</strong> ${session.hrNotes}<br><small style="color: #64748b">Audited by: ${session.reviewedBy || 'Admin'} on ${session.reviewedAt || 'N/A'}</small></div>` : ''}

  <h3 style="margin-top: 28px; margin-bottom: 8px; font-size: 16px;">Violation Event Timeline (${session.violations.length} Incidents)</h3>
  ${
    session.violations.length === 0
      ? '<p style="color: #16a34a; font-size: 14px;">No suspicious events or strikes recorded during this session. Certified clean integrity.</p>'
      : `<table>
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Violation Type</th>
              <th>Strike</th>
              <th>Severity</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            ${session.violations
              .map(
                (v) => `
              <tr>
                <td>${new Date(v.timestamp).toLocaleTimeString()}</td>
                <td><strong>${v.type.replace('_', ' ')}</strong></td>
                <td>Strike ${v.strikeNumber}</td>
                <td><span style="color: ${v.severity === 'critical' ? '#dc2626' : v.severity === 'high' ? '#ea580c' : '#ca8a04'}">${v.severity.toUpperCase()}</span></td>
                <td>${v.details}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>`
  }

  <div style="margin-top: 40px; text-align: center;">
    <button onclick="window.print()" style="padding: 8px 20px; background: #2563eb; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">Print / Save as PDF</button>
  </div>
</body>
</html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}
