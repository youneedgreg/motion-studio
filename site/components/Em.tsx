// One emphasis phrase per heading, in Fraunces italic. Full stops stay ink: pass them outside.
export default function Em({ children }: { children: React.ReactNode }) {
  return <span className="em">{children}</span>;
}
