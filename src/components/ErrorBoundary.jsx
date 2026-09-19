import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { err: null, stack: '' };
  }
  static getDerivedStateFromError(err) {
    return { err };
  }
  componentDidCatch(err, info) {
    this.setState({ stack: info.componentStack });
  }
  render() {
    if (this.state.err) {
      return (
        <div className="workspace" role="alert">
          <div className="rounded-md border border-red-200 bg-red-50 p-4 font-mono text-xs text-red-800">
            <p className="font-bold">Render error: {String(this.state.err.message || this.state.err)}</p>
            <pre className="mt-2 overflow-auto whitespace-pre-wrap">{this.state.stack || this.state.err.stack}</pre>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}