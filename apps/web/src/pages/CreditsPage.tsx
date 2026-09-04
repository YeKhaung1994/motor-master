import {
  BackLink,
  Divider,
  Heading,
  PageContainer,
  Skeleton,
  SpecTable,
  Text,
} from '@motor-master/share_ui';
import { useImageCredits } from '../features/credits/hooks';

/**
 * Most of the photography is CC BY-SA, which requires attribution and
 * share-alike terms to be carried with the work. This page is where that
 * obligation is met in public.
 */
export function CreditsPage() {
  const creditsQuery = useImageCredits();
  const credits = creditsQuery.data ?? [];

  return (
    <PageContainer as="main" className="page">
      <BackLink href="/" context="all bikes" />
      <Heading level={1} size="lg">
        Image credits
      </Heading>
      <Text tone="muted">
        Model photography comes from Wikimedia Commons and is reused under the licence
        named against each photo. Specifications come from manufacturer sheets and the
        price sources credited on each bike.
      </Text>

      <Divider spaced />

      {creditsQuery.isPending ? <Skeleton height={320} /> : null}

      {creditsQuery.isSuccess && credits.length === 0 ? (
        <Text tone="muted">No photography is in use yet.</Text>
      ) : null}

      {credits.length > 0 ? (
        <>
          <Text size="sm" tone="muted">
            {credits.length} photographs in use.
          </Text>
          <SpecTable
            caption="Photography credits"
            labelHeading="Model"
            columns={[
              { id: 'photographer', title: 'Photographer' },
              { id: 'licence', title: 'Licence' },
              { id: 'source', title: 'Source' },
            ]}
            groups={[
              {
                title: 'Wikimedia Commons',
                rows: credits.map((credit) => ({
                  field: credit.slug,
                  label: credit.model,
                  values: [
                    credit.artist ?? 'Unknown',
                    credit.licenseUrl ? (
                      <a href={credit.licenseUrl} target="_blank" rel="noreferrer noopener">
                        {credit.license ?? 'See source'}
                      </a>
                    ) : (
                      (credit.license ?? 'See source')
                    ),
                    <a
                      key={credit.slug}
                      href={credit.source}
                      target="_blank"
                      rel="noreferrer noopener"
                    >
                      {credit.title}
                    </a>,
                  ],
                })),
              },
            ]}
          />
        </>
      ) : null}
    </PageContainer>
  );
}
