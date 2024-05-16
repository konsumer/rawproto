export default function ButtonDownloadJSON ({ tree, prefix = 'f', typeMap, nameMap, children = 'Download JSON', className = 'btn btn-primary', filename = 'download.json' }) {
  const handleClick = e => {
    e.target.setAttribute('href', `data:application/json;base64,${btoa(unescape(encodeURIComponent(JSON.stringify(tree.toJS(undefined, prefix, nameMap, typeMap), null, 2))))}`)
  }
  return <a className={className} onClick={handleClick} href='#proto' download={filename}>{children}</a>
}
