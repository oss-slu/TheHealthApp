import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ConfirmDialog } from '../../components/ui';
import { integrationService } from '../../services/integrationService.js';

const KEY = 'common:connectedApps';

const buttonBase =
  'rounded border px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60';

/**
 * Lets users see their connected health apps, disconnect them and delete what was imported (#207).
 * Always available: it does not depend on health consent or on integrations being enabled.
 */
const ConnectedHealthApps = () => {
  const { t, i18n } = useTranslation(['common']);
  const descriptionId = useId();
  const [connections, setConnections] = useState([]);
  const [loadState, setLoadState] = useState('loading'); // loading | ready | error
  // { type: 'disconnect' | 'delete', connection }
  const [pending, setPending] = useState(null);
  const [alsoDelete, setAlsoDelete] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [result, setResult] = useState(null); // { tone: 'success' | 'error', message }
  const headingRefs = useRef({});
  const triggerRef = useRef(null);

  const providerName = (provider) => t(`${KEY}.providers.${provider}`, { defaultValue: provider });

  const formatDate = (value) => {
    if (!value) return '';
    try {
      return new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium' }).format(new Date(value));
    } catch {
      return value;
    }
  };

  const loadConnections = useCallback(async () => {
    setLoadState('loading');
    try {
      const data = await integrationService.listConnections();
      setConnections(Array.isArray(data) ? data : []);
      setLoadState('ready');
    } catch {
      setLoadState('error');
    }
  }, []);

  useEffect(() => {
    loadConnections();
  }, [loadConnections]);

  const openDialog = (type, connection, event) => {
    triggerRef.current = event.currentTarget;
    setAlsoDelete(false);
    setResult(null);
    setPending({ type, connection });
  };

  const closeDialog = () => {
    setPending(null);
    // Return focus to the button that opened the dialog.
    requestAnimationFrame(() => triggerRef.current?.focus());
  };

  const focusConnection = (id) => {
    requestAnimationFrame(() => headingRefs.current[id]?.focus());
  };

  const replaceConnection = (updated) => {
    setConnections((current) => current.map((item) => (item.id === updated.id ? updated : item)));
  };

  const runAction = async () => {
    if (!pending) return;
    const { type, connection } = pending;
    const provider = providerName(connection.provider);
    const deleteWithDisconnect = type === 'disconnect' && alsoDelete;
    setPending(null);
    setBusyId(connection.id);

    try {
      const data =
        type === 'disconnect'
          ? await integrationService.disconnect(connection.id, { deleteImportedData: deleteWithDisconnect })
          : await integrationService.deleteImportedData(connection.id);
      replaceConnection(data.connection);

      const count = data.deleted_count ?? 0;
      let message;
      if (type === 'disconnect') {
        message = deleteWithDisconnect
          ? t(`${KEY}.disconnectAndDeleteSuccess`, { provider, count })
          : t(`${KEY}.disconnectSuccess`, { provider });
      } else {
        message = count > 0
          ? t(`${KEY}.deleteSuccess`, { provider, count })
          : t(`${KEY}.deleteEmpty`, { provider });
      }
      setResult({ tone: 'success', message });
    } catch (error) {
      if (error?.status === 404) {
        setResult({ tone: 'error', message: t(`${KEY}.notFound`) });
      } else {
        const errorKey = type === 'disconnect' ? 'disconnectError' : 'deleteError';
        setResult({ tone: 'error', message: t(`${KEY}.${errorKey}`, { provider }) });
      }
      // The server is the source of truth; reload so the list shows what actually happened.
      loadConnections();
    } finally {
      setBusyId(null);
      focusConnection(connection.id);
    }
  };

  const renderDialog = () => {
    if (!pending) return null;
    const { type, connection } = pending;
    const provider = providerName(connection.provider);
    const count = connection.imported_count ?? 0;

    if (type === 'disconnect') {
      return (
        <ConfirmDialog
          open
          tone="critical"
          initialFocus="cancel"
          title={t(`${KEY}.disconnectTitle`, { provider })}
          description={<p>{t(`${KEY}.disconnectDescription`, { provider })}</p>}
          confirmLabel={t(`${KEY}.disconnectConfirm`)}
          cancelLabel={t(`${KEY}.cancel`)}
          onConfirm={runAction}
          onCancel={closeDialog}
        >
          {count > 0 ? (
            <label className="flex items-start gap-2 text-sm text-[var(--text-primary)]">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4"
                checked={alsoDelete}
                onChange={(event) => setAlsoDelete(event.target.checked)}
              />
              <span>{t(`${KEY}.disconnectAlsoDelete`, { provider, count })}</span>
            </label>
          ) : null}
        </ConfirmDialog>
      );
    }

    return (
      <ConfirmDialog
        open
        tone="critical"
        initialFocus="cancel"
        title={t(`${KEY}.deleteTitle`, { provider })}
        description={
          <>
            <p>{t(`${KEY}.deleteDescription`, { provider, count })}</p>
            {connection.status === 'connected' ? (
              <p>{t(`${KEY}.deleteStillConnected`, { provider })}</p>
            ) : null}
          </>
        }
        confirmLabel={t(`${KEY}.deleteConfirm`)}
        cancelLabel={t(`${KEY}.cancel`)}
        onConfirm={runAction}
        onCancel={closeDialog}
      />
    );
  };

  const renderConnection = (connection) => {
    const provider = providerName(connection.provider);
    const connected = connection.status === 'connected';
    const count = connection.imported_count ?? 0;
    const busy = busyId === connection.id;
    const statusId = `connection-status-${connection.id}`;
    const types = (connection.granted_types || [])
      .map((type) => t(`${KEY}.measurementTypes.${type}`, { defaultValue: type }))
      .join(', ');

    return (
      <li key={connection.id} className="rounded border border-gray-200 p-4" aria-busy={busy || undefined}>
        <div className="flex flex-wrap items-center gap-2">
          <h4
            ref={(node) => {
              headingRefs.current[connection.id] = node;
            }}
            tabIndex={-1}
            className="font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-700"
          >
            {provider}
          </h4>
          <span
            id={statusId}
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${connected ? 'status-ok' : 'bg-gray-100 text-gray-700'}`}
          >
            {t(connected ? `${KEY}.statusConnected` : `${KEY}.statusDisconnected`)}
          </span>
        </div>

        <dl className="mt-2 space-y-1 text-sm text-gray-600">
          <div>
            <dt className="sr-only">{t(`${KEY}.dateLabel`)}</dt>
            <dd>
              {connected
                ? t(`${KEY}.connectedOn`, { date: formatDate(connection.connected_at) })
                : t(`${KEY}.disconnectedOn`, { date: formatDate(connection.disconnected_at) })}
            </dd>
          </div>
          {types ? (
            <div>
              <dt className="sr-only">{t(`${KEY}.allowedTypesLabel`)}</dt>
              <dd>{t(`${KEY}.allowedTypes`, { types })}</dd>
            </div>
          ) : null}
          <div>
            <dt className="sr-only">{t(`${KEY}.importedLabel`)}</dt>
            <dd>{count > 0 ? t(`${KEY}.importedCount`, { count }) : t(`${KEY}.noImportedData`)}</dd>
          </div>
        </dl>

        <div className="mt-3 flex flex-wrap gap-2">
          {connected ? (
            <button
              type="button"
              onClick={(event) => openDialog('disconnect', connection, event)}
              disabled={busy}
              aria-label={busy ? undefined : t(`${KEY}.disconnectProvider`, { provider })}
              className={`${buttonBase} border-teal-800 text-teal-900 hover:bg-teal-50 focus:ring-teal-700`}
            >
              {busy ? t(`${KEY}.working`) : t(`${KEY}.disconnect`)}
            </button>
          ) : null}
          <button
            type="button"
            onClick={(event) => openDialog('delete', connection, event)}
            // Disabled rather than hidden, so users can see the option exists when there is nothing to delete.
            disabled={busy || count === 0}
            aria-label={busy ? undefined : t(`${KEY}.deleteDataForProvider`, { provider })}
            className={`${buttonBase} border-red-700 text-red-800 hover:bg-red-50 focus:ring-red-700`}
          >
            {busy ? t(`${KEY}.working`) : t(`${KEY}.deleteData`)}
          </button>
        </div>
      </li>
    );
  };

  let body;
  if (loadState === 'loading') {
    body = (
      <p role="status" aria-busy="true" className="mt-3 text-sm text-gray-600">
        {t(`${KEY}.loading`)}
      </p>
    );
  } else if (loadState === 'error') {
    body = (
      <div role="alert" className="mt-3 text-sm text-red-700">
        <p>{t(`${KEY}.loadError`)}</p>
        <button
          type="button"
          onClick={loadConnections}
          className="mt-2 font-semibold underline underline-offset-2 focus:outline-none focus:ring-2 focus:ring-red-700"
        >
          {t(`${KEY}.retry`)}
        </button>
      </div>
    );
  } else if (connections.length === 0) {
    body = <p className="mt-3 text-sm text-gray-600">{t(`${KEY}.empty`)}</p>;
  } else {
    body = <ul className="mt-3 space-y-3">{connections.map(renderConnection)}</ul>;
  }

  return (
    <section aria-labelledby="connected-apps-title" aria-describedby={descriptionId}>
      <h3 id="connected-apps-title" className="font-medium text-gray-900">
        {t(`${KEY}.title`)}
      </h3>
      <p id={descriptionId} className="mt-1 text-sm text-gray-600">
        {t(`${KEY}.description`)}
      </p>

      {/* Always mounted so screen readers announce results as they change. */}
      <div role="status" aria-live="polite" className="text-sm text-green-800">
        {result?.tone === 'success' ? <p className="mt-2">{result.message}</p> : null}
      </div>
      {result?.tone === 'error' ? (
        <p role="alert" className="mt-2 text-sm text-red-700">
          {result.message}
        </p>
      ) : null}

      {body}
      {renderDialog()}
    </section>
  );
};

export default ConnectedHealthApps;
