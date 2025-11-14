import { Component, ReactNode } from 'react';
import { ErrorFallback } from '@/components/ErrorFallback';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class SpreadsheetErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Spreadsheet error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback
          error={this.state.error}
          resetError={() => this.setState({ hasError: false })}
          title="Spreadsheet Error"
          description="There was an error loading the spreadsheet. Please try refreshing or creating a new table."
        />
      );
    }

    return this.props.children;
  }
}
