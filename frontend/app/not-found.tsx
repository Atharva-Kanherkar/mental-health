import ErrorPage from '@/components/ErrorPage';

export default function NotFound() {
  const notFoundError = {
    type: 'server' as const,
    title: 'Page Not Found',
    message: 'The page you\'re looking for doesn\'t exist in your sanctuary.',
    suggestion: 'It may have been moved or you might have typed the wrong address. Let\'s get you back to safety.',
    canRetry: false
  };

  return (
    <ErrorPage 
      error={notFoundError}
      showContactSupport={false}
    />
  );
}
