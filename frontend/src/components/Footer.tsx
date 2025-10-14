export default function Footer() {
  return (
    <footer style={{ padding: '1rem', borderTop: '1px solid #ccc', textAlign: 'center', marginTop: '2rem' }}>
      <p style={{ color: '#e8e8e8' }}>&copy; {new Date().getFullYear()} BrainSpaghetti. All rights reserved.</p>
    </footer>
  );
}
