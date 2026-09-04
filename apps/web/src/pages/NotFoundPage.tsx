import { Button, EmptyState, PageContainer } from '@motor-master/share_ui';

export function NotFoundPage() {
  return (
    <PageContainer as="main" className="page">
      <EmptyState
        headline="That page does not exist"
        body="The link may be out of date. Start from the catalogue and find the bike from there."
        action={<Button href="/">Browse all bikes</Button>}
      />
    </PageContainer>
  );
}
