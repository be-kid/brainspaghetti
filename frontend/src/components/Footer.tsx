export default function Footer() {
  return (
    <footer style={{ padding: '1rem', borderTop: '1px solid #ccc', textAlign: 'center', marginTop: '2rem' }}>
      <p>&copy; {new Date().getFullYear()} BrainSpaghetti. All rights reserved.</p>
    </footer>
  );
}
