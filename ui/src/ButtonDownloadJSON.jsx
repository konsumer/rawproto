export default function ButtonDownloadJSON ({ tree, prefix = 'f', typeMap, nameMap, children = 'Download JSON', className = 'btn btn-primary', filename = 'download.json' }) {
  const handleClick = e => {
    const d = tree.toJS(undefined, prefix, nameMap, typeMap)
    console.log({ tree, typeMap, nameMap, json: d })
    const u = URL.createObjectURL(new Blob([JSON.stringify(d, null, 2)], { type: 'application/json' }))
    e.target.setAttribute('href', u)
    setTimeout(() => URL.revokeObjectURL(u), 0)
  }

  return <a className={className} onClick={handleClick} href='#proto' download={filename}>{children}</a>
}
