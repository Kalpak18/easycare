export default function Card({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl shadow p-6">
      {children}
    </div>
  );
}