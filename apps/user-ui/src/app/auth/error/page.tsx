export default function GoogleAuthErrorPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ui-background text-text-primary">
      <div className="container mx-auto p-4 text-center">
        <h1 className="text-3xl font-heading font-semibold mb-4 text-feedback-error">Authentication Error</h1>
        <p className="text-lg text-text-secondary">There was an issue logging you in. Please try again.</p>
        {/* You might want to display a more specific error message or a link to retry */}
      </div>
    </div>
  );
}