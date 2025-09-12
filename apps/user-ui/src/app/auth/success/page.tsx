export default function GoogleAuthSuccessPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ui-background text-text-primary">
      <div className="container mx-auto p-4 text-center">
        <h1 className="text-3xl font-heading font-semibold mb-4 text-feedback-success">Authentication Successful!</h1>
        <p className="text-lg text-text-secondary">You have been successfully logged in.</p>
        {/* You might want to redirect to a protected route here */}
      </div>
    </div>
  );
}