import { useEffect, useState } from 'react'
import { fetchVersions } from '../api'
import { PageHeader, StatusMessage } from '../components/PageHeader.jsx'
import { useUiLanguage } from '../uiLanguage'
import { bookCountLabel, t } from '../uiStrings'
import { displayVersionName, groupVersions } from '../versionMeta'

export default function VersionsPage() {
  const [versions, setVersions] = useState([])
  const [loading, setLoading] = useState(true)
  const [failure, setFailure] = useState(null)
  const lang = useUiLanguage()

  useEffect(() => {
    let cancelled = false
    fetchVersions()
      .then((data) => {
        if (!cancelled) {
          setVersions(data)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setFailure(err.message ?? '')
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  const groups = groupVersions(versions, t(lang, 'otherLanguages'))
  const error = failure == null ? '' : failure || t(lang, 'versionsError')

  return (
    <section className="page">
      <PageHeader
        title={t(lang, 'appTitle')}
        lang={lang}
      />
      <StatusMessage
        loading={loading}
        error={error}
        empty={!loading && !error && versions.length === 0}
        lang={lang}
      />
      {groups.map((group) => (
        <div key={group.id} className="version-group">
          <h2 className="section-heading">
            <span>{group.label}</span>
          </h2>
          <ul className="card-list">
            {group.items.map((item) => (
              <li key={item.version}>
                <a className="card" href={`#/versions/${encodeURIComponent(item.version)}/books`}>
                  <strong>{displayVersionName(item.version)}</strong>
                  <span>{bookCountLabel(lang, item.bookCount)}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  )
}
