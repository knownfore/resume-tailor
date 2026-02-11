export const metadata = {
  title: "ATS Resume Tailor",
  description: "Tailor your resume to a job posting"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial", margin: 0 }}>
        {children}
      </body>
    </html>
  );
}
