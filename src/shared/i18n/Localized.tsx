import { cloneElement, Fragment, isValidElement, type ReactElement, type ReactNode } from 'react';
import { t, useTranslation } from './i18n';

const translatedStringProps = ['aria-label', 'title', 'placeholder', 'alt'] as const;

function localizeNode(node: ReactNode): ReactNode {
  if (typeof node === 'string') return t(node);
  if (typeof node === 'number' || typeof node === 'boolean' || node === null || node === undefined) return node;
  if (Array.isArray(node)) return node.map(localizeNode);
  if (!isValidElement(node)) return node;

  const element = node as ReactElement<Record<string, unknown>>;
  const props: Record<string, unknown> = {};
  for (const prop of translatedStringProps) {
    const value = element.props[prop];
    if (typeof value === 'string') props[prop] = t(value);
  }
  if ('children' in element.props) props.children = localizeNode(element.props.children as ReactNode);
  return cloneElement(element, props);
}

export function Localized({ children }: { children: ReactNode }) {
  useTranslation();
  return <Fragment>{localizeNode(children)}</Fragment>;
}
