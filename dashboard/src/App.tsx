import { useState, useEffect } from 'react';
import { Button, Card, } from '@heroui/react';
import {
  ShieldCheck,
  Zap,
  Activity,
  AlertTriangle,
  Server,
  RefreshCw,
  Play,
  XCircle
} from 'lucide-react';

const GATEWAY_URL = import.meta.env.VITE_GATEWAY_URL || 'http://localhost:3000';

type DashboardEvent =
  | {
      type: 'request';
      timestamp: string;
      data: {
        requestId: string;
        userId: string;
        status: 'success' | 'failed' | 'fallback';
        source: string;
      };
    }
  | {
      type: 'circuit_breaker';
      timestamp: string;
      data: {
        state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
        failures: number;
        total: number;
      };
    }
  | {
      type: 'service_health';
      timestamp: string;
      data: {
        service: string;
        status: 'online' | 'offline';
      };
    }
  | {
      type: 'log';
      timestamp: string;
      data: {
        message: string;
        level: 'info' | 'error' | 'warning';
      };
    };

interface RequestLog {
  id: string;
  requestId: string;
  userId: string;
  status: 'success' | 'failed' | 'fallback';
  source: string;
  timestamp: string;
}

interface SystemLog {
  id: string;
  message: string;
  level: 'info' | 'error' | 'warning';
  time: string;
}

function App() {
  const [gatewayStatus, setGatewayStatus] = useState<'online' | 'offline'>('offline');
  const [recommendationStatus, setRecommendationStatus] = useState<'online' | 'offline'>('offline');
  const [circuitState, setCircuitState] = useState<'CLOSED' | 'OPEN' | 'HALF_OPEN'>('CLOSED');
  const [failures, setFailures] = useState(0);
  const [totalRequests, setTotalRequests] = useState(0);
  const [requestLogs, setRequestLogs] = useState<RequestLog[]>([]);
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);
  const [isAutoRequesting, setIsAutoRequesting] = useState(false);
  const [isCrashEnabled, setIsCrashEnabled] = useState(false);

  const handleDashboardEvent = (event: DashboardEvent) => {
    switch (event.type) {
      case 'request':
        addRequestLog(event.data);
        break;
      case 'circuit_breaker':
        setCircuitState(event.data.state);
        setFailures(event.data.failures);
        setTotalRequests(event.data.total);
        break;
      case 'service_health':
        if (event.data.service === 'gateway') {
          setGatewayStatus(event.data.status);
        } else if (event.data.service === 'recommendation-svc') {
          setRecommendationStatus(event.data.status);
        }
        break;
      case 'log':
        addSystemLog(event.data.message, event.data.level);
        break;
    }
  };

  const addRequestLog = (data: {
    requestId: string;
    userId: string;
    status: 'success' | 'failed' | 'fallback';
    source: string;
  }) => {
    const log: RequestLog = {
      id: Date.now().toString(),
      requestId: data.requestId,
      userId: data.userId,
      status: data.status,
      source: data.source,
      timestamp: new Date().toLocaleTimeString()
    };
    setRequestLogs(prev => [log, ...prev].slice(0, 20));
  };

  const addSystemLog = (message: string, level: 'info' | 'error' | 'warning') => {
    const log: SystemLog = {
      id: Date.now().toString(),
      message,
      level,
      time: new Date().toLocaleTimeString()
    };
    setSystemLogs(prev => [log, ...prev].slice(0, 10));
  };

  const handleSimulateCrash = async (shouldCrash: boolean) => {
    try {
      const response = await fetch(`${GATEWAY_URL}/control/simulate-crash`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shouldCrash })
      });
      if (response.ok) {
        setIsCrashEnabled(shouldCrash);
        addSystemLog(`Crash simulation ${shouldCrash ? 'ENABLED' : 'DISABLED'}`, shouldCrash ? 'warning' : 'info');
      }
    } catch (error) {
      console.error('Error toggling crash:', error);
      addSystemLog('Failed to toggle crash simulation', 'error');
    }
  };

  const handleStartTraffic = () => {
    setIsAutoRequesting(!isAutoRequesting);
  };

  const getCircuitColor = () => {
    switch (circuitState) {
      case 'CLOSED': return 'text-emerald-400 border-emerald-500/30';
      case 'OPEN': return 'text-red-400 border-red-500/30';
      case 'HALF_OPEN': return 'text-yellow-400 border-yellow-500/30';
    }
  };

  const getCircuitBgColor = () => {
    switch (circuitState) {
      case 'CLOSED': return 'bg-emerald-500';
      case 'OPEN': return 'bg-red-500';
      case 'HALF_OPEN': return 'bg-yellow-500';
    }
  };

  const getCircuitIcon = () => {
    switch (circuitState) {
      case 'CLOSED': return <ShieldCheck size={32} />;
      case 'OPEN': return <AlertTriangle size={32} />;
      case 'HALF_OPEN': return <RefreshCw size={32} className="animate-spin" />;
    }
  };

  // SSE Connection
  useEffect(() => {
    const eventSource = new EventSource(`${GATEWAY_URL}/dashboard/stream`);

    eventSource.onopen = () => {
      console.log('SSE Connected');
      addSystemLog('Connected to Gateway', 'info');
    };

    eventSource.onmessage = (event) => {
      try {
        const dashboardEvent: DashboardEvent = JSON.parse(event.data);
        handleDashboardEvent(dashboardEvent);
      } catch (error) {
        console.error('Error parsing SSE event:', error);
      }
    };

    eventSource.onerror = () => {
      console.error('SSE Error');
      addSystemLog('Gateway: Connection lost', 'error');
      setGatewayStatus('offline');
    };

    return () => {
      eventSource.close();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-request simulation
  useEffect(() => {
    if (!isAutoRequesting) return;

    const interval = setInterval(async () => {
      const userId = ['123', '456', '789', 'abc', 'def'][Math.floor(Math.random() * 5)];
      try {
        await fetch(`${GATEWAY_URL}/recommendations/user/${userId}`);
      } catch (error) {
        console.error('Request failed:', error);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [isAutoRequesting]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-8 font-sans">
      <header className="mb-10 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Zap className="text-yellow-400" /> Nest.js Resilience Demo
          </h1>
          <p className="text-slate-400 mt-2">Simulating Netflix Patterns: API Gateway & Circuit Breaker (Opossum)</p>
        </div>
        <div className="flex gap-4">
          <Button
            onPress={handleStartTraffic}
            variant={isAutoRequesting ? 'danger' : 'secondary'}
            className="flex items-center gap-2"
          >
            {isAutoRequesting ? (
              <>
                <Activity className="animate-pulse" size={18} />
                Stop Traffic
              </>
            ) : (
              <>
                <Play size={18} />
                Start Traffic
              </>
            )}
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* SECTION 1: SYSTEM ARCHITECTURE */}
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <Server className="text-blue-400" /> Microservices Control
          </h2>

          <div className="space-y-6">
            <Card className="p-4 bg-slate-700/50 border-slate-600">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-blue-300">API Gateway</span>
                <span className={`text-xs px-2 py-1 rounded ${
                  gatewayStatus === 'online' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  {gatewayStatus.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-slate-400">Nest.js Gateway with Opossum Breaker</p>
            </Card>

            <Card className="p-4 bg-slate-700/50 border-slate-600">
              <div className="flex justify-between items-center mb-4">
                <span className="font-medium text-purple-300">Recommendation Service</span>
                <div className={`h-3 w-3 rounded-full ${
                  recommendationStatus === 'online' && !isCrashEnabled
                    ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]'
                    : 'bg-red-500 animate-pulse shadow-[0_0_8px_#ef4444]'
                }`}></div>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  fullWidth
                  variant={!isCrashEnabled ? 'secondary' : 'ghost'}
                  onPress={() => handleSimulateCrash(false)}
                >
                  Healthy
                </Button>
                <Button
                  size="sm"
                  fullWidth
                  variant={isCrashEnabled ? 'danger' : 'ghost'}
                  onPress={() => handleSimulateCrash(true)}
                >
                  Simulate Crash
                </Button>
              </div>
            </Card>

            <div className="mt-8">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">
                Circuit Breaker State
              </h3>
              <div className="flex flex-col items-center gap-4">
                <div className={`w-24 h-24 rounded-full border-8 flex items-center justify-center transition-all duration-500 ${
                  getCircuitColor()
                }`}>
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                    getCircuitBgColor()
                  }`}>
                    {getCircuitIcon()}
                  </div>
                </div>
                <span className={`text-xl font-bold ${getCircuitColor().split(' ')[0]}`}>
                  {circuitState}
                </span>
                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-red-500 h-full transition-all duration-300"
                    style={{ width: `${totalRequests > 0 ? (failures / totalRequests) * 100 : 0}%` }}
                  ></div>
                </div>
                <p className="text-xs text-slate-500">
                  Failures: {failures} / {totalRequests}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: LIVE TRAFFIC MONITOR */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="p-6 bg-slate-800 border-slate-700 h-[400px] flex flex-col">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Activity className="text-emerald-400" /> Live Request Stream
            </h2>
            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
              {requestLogs.length === 0 && (
                <div className="h-full flex items-center justify-center text-slate-500 italic">
                  No active traffic. Click "Start Traffic" to begin simulation.
                </div>
              )}
              {requestLogs.map((req) => (
                <div
                  key={req.id}
                  className="flex items-center gap-4 bg-slate-900/50 p-4 rounded-xl border border-slate-700 animate-in fade-in slide-in-from-right-4 duration-300"
                >
                  <div className={`p-2 rounded-lg ${
                    req.status === 'success'
                      ? 'bg-emerald-500/10 text-emerald-500'
                      : req.status === 'fallback'
                      ? 'bg-yellow-500/10 text-yellow-500'
                      : 'bg-red-500/10 text-red-500'
                  }`}>
                    {req.status === 'success' ? (
                      <RefreshCw size={18} />
                    ) : req.status === 'fallback' ? (
                      <AlertTriangle size={18} />
                    ) : (
                      <XCircle size={18} />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-mono text-slate-500">ID: {req.requestId}</span>
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                        req.status === 'success'
                          ? 'bg-emerald-500 text-white'
                          : req.status === 'fallback'
                          ? 'bg-yellow-500 text-white'
                          : 'bg-red-500 text-white'
                      }`}>
                        {req.status}
                      </span>
                    </div>
                    <div className="text-sm mt-1 font-medium">
                      GET /recommendations/user/{req.userId}
                    </div>
                    {req.source && (
                      <div className="text-xs text-slate-400 mt-1 font-mono italic">
                        ↳ {req.source}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
              System Logs
            </h3>
            <div className="space-y-2 font-mono text-xs">
              {systemLogs.map((log) => (
                <div key={log.id} className="flex gap-4">
                  <span className="text-slate-600 shrink-0">[{log.time}]</span>
                  <span className={
                    log.level === 'error'
                      ? 'text-red-400'
                      : log.level === 'warning'
                      ? 'text-yellow-400'
                      : 'text-emerald-400'
                  }>
                    {log.message}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <footer className="mt-12 pt-8 border-t border-slate-800 text-center text-slate-500 text-sm">
        <p>
          This demo visualizes the <strong>Opossum</strong> circuit breaker logic integrated into a{' '}
          <strong>Nest.js</strong> Gateway.
        </p>
        <p className="mt-2 text-xs">
          When errors cross the threshold, the Gateway prevents cascading failures by short-circuiting and
          serving fallback data.
        </p>
      </footer>
    </div>
  );
}

export default App;
