import { createContext, useContext } from 'react';
import type { AnchorHTMLAttributes, ComponentType, ReactNode } from 'react';

export interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  children?: ReactNode;
}

export type LinkComponent = ComponentType<LinkProps>;

/** Plain anchor — used when no router is provided (Storybook, tests). */
const DefaultLink: LinkComponent = ({ href, children, ...rest }) => (
  <a href={href} {...rest}>
    {children}
  </a>
);

const LinkContext = createContext<LinkComponent>(DefaultLink);

/**
 * Lets the host app inject its router's link (e.g. React Router `Link`) so every
 * navigational element in share_ui routes client-side without the app reaching
 * for a raw anchor of its own.
 */
export function LinkProvider({
  component,
  children,
}: {
  component: LinkComponent;
  children: ReactNode;
}) {
  return <LinkContext.Provider value={component}>{children}</LinkContext.Provider>;
}

export function useLinkComponent(): LinkComponent {
  return useContext(LinkContext);
}
