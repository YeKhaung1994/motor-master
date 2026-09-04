import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';
import { useLinkComponent } from '../Link';
import { cx } from '../../utils/cx';
import styles from './styles.module.css';

export type ButtonVariant = 'primary' | 'ghost' | 'compare' | 'danger';
export type ButtonSize = 'md' | 'sm';

interface CommonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  iconStart?: ReactNode;
  iconEnd?: ReactNode;
  children?: ReactNode;
}

type ButtonElementProps = CommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & { href?: undefined };

type LinkElementProps = CommonProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'children' | 'href'> & {
    href: string;
    disabled?: boolean;
  };

export type ButtonProps = ButtonElementProps | LinkElementProps;

export function Button(props: ButtonProps) {
  const Link = useLinkComponent();
  const {
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    iconStart,
    iconEnd,
    className,
    children,
    ...rest
  } = props;

  const classes = cx(
    styles.button,
    styles[variant],
    styles[size],
    fullWidth && styles.fullWidth,
    className,
  );

  const content = (
    <>
      {iconStart}
      {children}
      {iconEnd}
    </>
  );

  if (typeof props.href === 'string') {
    const { href, disabled, ...anchorRest } = rest as LinkElementProps;
    return (
      <Link
        href={href}
        className={cx(classes, disabled && styles.disabled)}
        aria-disabled={disabled || undefined}
        {...anchorRest}
      >
        {content}
      </Link>
    );
  }

  const { type = 'button', ...buttonRest } = rest as ButtonElementProps;
  return (
    <button type={type} className={classes} {...buttonRest}>
      {content}
    </button>
  );
}
