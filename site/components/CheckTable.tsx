import type { CheckRow } from '@/lib/content';

// A tools/check.py report as a table: label, value, and its pass/fail status where the check has one.
export default function CheckTable({ rows }: { rows: CheckRow[] }) {
  return (
    <div className="table-wrap">
      <table className="data report">
        <thead><tr><th>Check</th><th>Result</th><th>Status</th></tr></thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td>{r.label}</td>
              <td>
                {r.value}
                {r.detail.length > 0 && <div className="detail">{r.detail.join(' ')}</div>}
              </td>
              <td className="st">{r.status === 'ok' ? <span className="chip chip-ok">OK</span> : r.status === 'fail' ? <span className="chip chip-bad">{r.statusText}</span> : <span className="chip">Report</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
