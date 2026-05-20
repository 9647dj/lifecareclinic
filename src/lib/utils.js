export function generatePatientCode(name, mobile) {
  if (!name || !mobile) return null;
  const namePart = name.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 4).padEnd(4, 'X');
  const mobilePart = String(mobile).replace(/\D/g, '').slice(-4);
  if (mobilePart.length < 4) return null;
  return `LC-${namePart}-${mobilePart}`;
}
