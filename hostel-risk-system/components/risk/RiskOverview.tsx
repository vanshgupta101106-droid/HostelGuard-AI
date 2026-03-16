export default function RiskOverview({ risks }) {
 return (
  <div>
   {risks.map((r) => (
    <p key={r.student_id}>{r.risk_level}</p>
   ))}
  </div>
 )
}
