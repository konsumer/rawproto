import LinkifyOrig from 'linkify-react'
import 'linkify-plugin-hashtag'

const linkifyOptions = {
  attributes: {
    target: '_new',
    className: 'underline'
  },
  formatHref: {
    hashtag: (href) => `https://twitter.com/hashtag/${href.substr(1)}`
  }
}

const Linkify = (props) => <LinkifyOrig {...props} options={{ ...linkifyOptions, ...props.options }} />

export default Linkify
