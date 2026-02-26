export const exportDatabaseCSV = () => {
  const a = document.createElement("a");
  a.href = `${process.env.NEXT_PUBLIC_BASE_URL}export/csv`;
  a.download = "database.zip";

  document.body.appendChild(a);
  a.click();
  a.remove();
};

