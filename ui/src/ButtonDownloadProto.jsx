export default function ButtonDownloadProto ({ tree, prefix = 'f', typeMap, nameMap, messageName = 'MessageRoot', children = 'Download Proto', className = 'btn btn-primary', filename = 'download.proto' }) {
  const handleClick = e => {
    e.target.setAttribute('href', `data:text/plain;base64,${btoa(unescape(encodeURIComponent(tree.toProto(undefined, prefix, nameMap, typeMap, messageName))))}`)
  }
  return <a className={className} onClick={handleClick} href='#proto' download={filename}>{children}</a>
}
