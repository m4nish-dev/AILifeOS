import { Component } from 'react'
import ErrorState from '../ErrorState/ErrorState'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorState 
          error={this.state.error} 
          onRetry={() => {
            this.setState({ hasError: false, error: null })
            window.location.reload()
          }} 
        />
      )
    }
    return this.props.children
  }
}
