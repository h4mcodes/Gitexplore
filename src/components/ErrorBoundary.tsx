import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, RotateCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
  onReset?: () => void;
  isCompact?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });
    // In a production app, this could also report to an observability service
    console.error('GitExplore Component Render Error:', error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  toggleDetails = (): void => {
    this.setState((prev) => ({ showDetails: !prev.showDetails }));
  };

  render(): ReactNode {
    if (this.state.hasError) {
      const {
        fallbackTitle = 'Something went wrong rendering this view',
        fallbackMessage = 'An unexpected error occurred while displaying repository intelligence. You can try recovering this component.',
        isCompact = false,
      } = this.props;

      if (isCompact) {
        return (
          <div className="error-boundary-compact" role="alert" aria-live="assertive">
            <div className="error-boundary-compact-left">
              <AlertTriangle size={14} className="error-boundary-icon" />
              <span className="error-boundary-compact-msg">{fallbackTitle}</span>
            </div>
            <button
              type="button"
              onClick={this.handleReset}
              className="error-boundary-retry-btn compact"
              title="Try recovering this component"
            >
              <RotateCw size={11} />
              <span>Retry</span>
            </button>
          </div>
        );
      }

      return (
        <div className="error-boundary-card" role="alert" aria-live="assertive">
          <div className="error-boundary-header">
            <div className="error-boundary-icon-wrap">
              <AlertTriangle size={18} className="error-boundary-icon" />
            </div>
            <div className="error-boundary-header-text">
              <h3 className="error-boundary-title">{fallbackTitle}</h3>
              <p className="error-boundary-msg">{fallbackMessage}</p>
            </div>
          </div>

          <div className="error-boundary-actions">
            <button
              type="button"
              onClick={this.handleReset}
              className="error-boundary-retry-btn"
            >
              <RotateCw size={13} />
              <span>Recover Component</span>
            </button>
            <button
              type="button"
              onClick={this.toggleDetails}
              className="error-boundary-details-toggle"
              aria-expanded={this.state.showDetails}
            >
              <span>{this.state.showDetails ? 'Hide Diagnostics' : 'Show Diagnostics'}</span>
              {this.state.showDetails ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          </div>

          {this.state.showDetails && this.state.error && (
            <div className="error-boundary-diagnostics">
              <div className="error-boundary-detail-row">
                <strong>Error:</strong> <code>{this.state.error.name}: {this.state.error.message}</code>
              </div>
              {this.state.errorInfo?.componentStack && (
                <pre className="error-boundary-stack">
                  {this.state.errorInfo.componentStack}
                </pre>
              )}
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
