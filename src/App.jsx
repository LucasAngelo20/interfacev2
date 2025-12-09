import React, { useState, useEffect } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Stack,
  CssBaseline,
  Select,
  Alert,
  Chip,
} from "@mui/material";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import MenuItem from "@mui/material/MenuItem";
import InputLabel from "@mui/material/InputLabel";
import FormControl from "@mui/material/FormControl";

const App = () => {
  const [formData, setFormData] = useState({
    Side: "both",
    Symbol: "USD",
    SpreadRiskAdjBps: "0",
    SpreadBuyBps: "0",
    SpreadSellBps: "0",
    OrderSizeDol: "30000",
    ThiefOrder: false,
    ThiefSpreadBuyBps: "0",
    ThiefSpreadSellBps: "0",
    ThiefOrderSizeDol: "30000",
    ToleranceBps: "2",
    Contracts: "0",
  });

  const [socket, setSocket] = useState(null);

  // Estados bem separados
  const [connectionStatus, setConnectionStatus] = useState("connecting"); // 'connecting' | 'connected' | 'disconnected'
  const [botRunning, setBotRunning] = useState(false);

  const [prices, setPrices] = useState(false);
  const [ask, setAsk] = useState("");
  const [bid, setBid] = useState("");
  const [thiefAsk, setThiefAsk] = useState("");
  const [thiefBid, setThiefBid] = useState("");
  const [spread, setSpread] = useState("");

  const [env, setEnv] = useState("prod");
  const [updateSocket, setUpdateSocket] = useState(false);

  // Risk Adjust
  const [riskAdjust, setRiskAdjust] = useState(null); // valor numérico bruto vindo da API (ex: 0.0003)
  const [riskAdjustUpdatedAt, setRiskAdjustUpdatedAt] = useState(null);
  const [riskAdjustHighlight, setRiskAdjustHighlight] = useState(false);

  // Notificações (toast)
  const [notifications, setNotifications] = useState([]); // {id, type, message}

  const riskAdjustBps =
    typeof riskAdjust === "number" ? riskAdjust * 10000 : null;

  const addNotification = (type, message) => {
    if (!message) return;
    setNotifications((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        type, // 'success' | 'error' | 'info' | 'warning'
        message,
      },
    ]);
  };

  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // WebSocket
  useEffect(() => {
    setConnectionStatus("connecting");

    const ws = new WebSocket(
      `ws://13.231.10.120:${env === "dev" ? 5050 : 7070}/ws`
    );
    setSocket(ws);

    ws.onopen = () => {
      console.log("WebSocket conectado");
      setConnectionStatus("connected");
      addNotification("success", "WebSocket connected");
    };

    ws.onerror = (error) => {
      console.error("Erro no WebSocket:", error);
      addNotification("error", "WebSocket error");
    };

    ws.onclose = () => {
      console.log("WebSocket desconectado");
      setConnectionStatus("disconnected");
      setBotRunning(false);
      addNotification("error", "WebSocket disconnected");
    };

    ws.onmessage = async (event) => {
      const message = JSON.parse(event.data);
      console.log("Mensagem recebida:", message);

      switch (message.Status) {
        case "prices":
          // Espera campos: Ask, Bid, ThiefAsk, ThiefBid, Spread
          setPrices(true);
          setAsk(message.Ask);
          setBid(message.Bid);
          setThiefAsk(message.ThiefAsk);
          setThiefBid(message.ThiefBid);
          setSpread(message.Spread);
          break;

        case "riskadjust":
          // Espera: Status: "riskadjust", Value: number (ex: 0.0003), Message (texto opcional)
          if (typeof message.Value === "number") {
            setRiskAdjust(message.Value);
            setRiskAdjustUpdatedAt(new Date());
            setRiskAdjustHighlight(true);
            setTimeout(() => setRiskAdjustHighlight(false), 1500);
          }
          if (message.Message) {
            addNotification("info", message.Message);
          }
          break;

        case "success":
          if (message.Message) {
            addNotification("success", message.Message);

            if (message.Message.includes("running")) {
              setBotRunning(true);
            }
            if (message.Message.includes("stopped")) {
              setBotRunning(false);
            }
          }
          break;

        case "error":
          addNotification("error", message.Message || "Unknown error");
          break;

        case "message":
          // logs gerais vindos do servidor (SendOrdersToSocket)
          if (message.Message) {
            addNotification("info", message.Message);
          }
          break;

        default:
          addNotification(
            "warning",
            `Unknown status from server: ${message.Status}`
          );
          break;
      }
    };

    return () => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [env, updateSocket]);

  // Handlers
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : name === "Side" || name === "Symbol"
          ? String(value)
          : value,
    }));
  };

  const sendMessage = (message) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    } else {
      console.error("WebSocket não está conectado");
      addNotification("error", "WebSocket is not connected");
    }
  };

  const handleSave = () => {
    const payload = {
      Type: "params",
      Data: formData,
    };
    console.log("Sending params:", payload);
    sendMessage(payload);
  };

  const handleStart = () => {
    sendMessage({
      Type: "text",
      Data: { Text: "start" },
    });
    setPrices(false);
  };

  const handleStop = () => {
    sendMessage({
      Type: "text",
      Data: { Text: "stop" },
    });
  };

  const handleCloseOrders = () => {
    sendMessage({
      Type: "text",
      Data: { Text: "cancelorders" },
    });
  };

  const handleRiskAdjustReset = () => {
    sendMessage({
      Type: "riskadjust",
      Data: {
        value: 0,
      },
    });
  };

  const handleShowRiskAdjust = () => {
    sendMessage({
      Type: "showriskadjust",
    });
  };

  const theme = createTheme({
    palette: {
      primary: {
        main: "#1976d2",
      },
      success: {
        main: "#2e7d32",
      },
      error: {
        main: "#d32f2f",
      },
    },
  });

  const connectionText =
    connectionStatus === "connected"
      ? "Connected to WebSocket"
      : connectionStatus === "connecting"
      ? "Connecting to WebSocket..."
      : "Disconnected from WebSocket";

  const connectionSeverity =
    connectionStatus === "connected"
      ? "success"
      : connectionStatus === "connecting"
      ? "info"
      : "error";

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ padding: 4, maxWidth: 1500, margin: "0 auto" }}>
        <Paper elevation={3} sx={{ padding: 4 }}>
          {/* Linha de status do bot + conexão */}
          <Stack
            direction="row"
            spacing={2}
            alignItems="center"
            justifyContent="space-between"
            mb={2}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <div
                style={{
                  width: 15,
                  height: 15,
                  borderRadius: 25,
                  background: botRunning ? "green" : "red",
                }}
              />
              <Typography
                variant="body2"
                sx={{ color: botRunning ? "green" : "red" }}
              >
                {botRunning ? "Bot is running" : "Bot is stopped"}
              </Typography>
            </Stack>

            <Chip
              label={connectionText}
              color={
                connectionStatus === "connected"
                  ? "success"
                  : connectionStatus === "connecting"
                  ? "info"
                  : "error"
              }
              variant={connectionStatus === "connected" ? "filled" : "outlined"}
              size="small"
            />
          </Stack>

          <Typography variant="h4" gutterBottom textAlign="center">
            Binance Configuration
          </Typography>

          {/* Side */}
          <FormControl fullWidth>
            <InputLabel id="SideId">Side</InputLabel>
            <Select
              labelId="SideId"
              name="Side"
              id="SideId"
              value={formData.Side}
              label="Side"
              onChange={handleChange}
              fullWidth
              style={{ margin: "0 0 40px 0" }}
            >
              <MenuItem value={"buy"}>Buy</MenuItem>
              <MenuItem value={"sell"}>Sell</MenuItem>
              <MenuItem value={"both"}>Both</MenuItem>
            </Select>
          </FormControl>

          {/* Thief order */}
          <FormControl fullWidth>
            <InputLabel id="ThiefOrderId">Thief order</InputLabel>
            <Select
              labelId="ThiefOrderId"
              name="ThiefOrder"
              id="ThiefOrderId"
              value={formData.ThiefOrder}
              label="ThiefOrder"
              onChange={handleChange}
              fullWidth
              style={{ margin: "0 0 40px 0" }}
            >
              <MenuItem value={true}>Enabled</MenuItem>
              <MenuItem value={false}>Disabled</MenuItem>
            </Select>
          </FormControl>

          {/* Inputs principais */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
            }}
          >
            <TextField
              style={{ margin: "0 0 40px 0" }}
              label="Spread Risk Adjust (Bps)"
              name="SpreadRiskAdjBps"
              type="text"
              value={formData.SpreadRiskAdjBps}
              onChange={handleChange}
            />

            <TextField
              style={{ margin: "0 0 40px 0" }}
              label="Spread Buy (Bps)"
              name="SpreadBuyBps"
              type="text"
              value={formData.SpreadBuyBps}
              onChange={handleChange}
            />
            <TextField
              style={{ margin: "0 0 40px 0" }}
              label="Spread Sell (Bps)"
              name="SpreadSellBps"
              type="text"
              value={formData.SpreadSellBps}
              onChange={handleChange}
            />
            <TextField
              style={{ margin: "0 0 40px 0" }}
              label="Order Size (Dol $)"
              name="OrderSizeDol"
              type="text"
              value={formData.OrderSizeDol}
              onChange={handleChange}
            />
            <TextField
              style={{ margin: "0 0 40px 0" }}
              label="Tolerance (Bps)"
              name="ToleranceBps"
              type="text"
              value={formData.ToleranceBps}
              onChange={handleChange}
            />

            {formData.ThiefOrder && (
              <>
                <TextField
                  style={{ margin: "0 0 40px 0" }}
                  label="Thief Spread Buy (Bps)"
                  name="ThiefSpreadBuyBps"
                  type="text"
                  value={formData.ThiefSpreadBuyBps}
                  onChange={handleChange}
                />
                <TextField
                  style={{ margin: "0 0 40px 0" }}
                  label="Thief Spread Sell (Bps)"
                  name="ThiefSpreadSellBps"
                  type="text"
                  value={formData.ThiefSpreadSellBps}
                  onChange={handleChange}
                />
                <TextField
                  style={{ margin: "0 0 40px 0" }}
                  label="Thief Order Size (Dol $)"
                  name="ThiefOrderSizeDol"
                  type="text"
                  value={formData.ThiefOrderSizeDol}
                  onChange={handleChange}
                />
              </>
            )}
          </div>

          {/* CARD DO RISK ADJUST */}
          <Box mt={4}>
            <Paper
              elevation={1}
              sx={{
                p: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderLeft: riskAdjustBps != null ? 4 : 0,
                borderLeftColor:
                  riskAdjustBps != null
                    ? riskAdjustBps > 0
                      ? "error.main"
                      : riskAdjustBps < 0
                      ? "success.main"
                      : "grey.500"
                    : "transparent",
                bgcolor: riskAdjustHighlight
                  ? "action.hover"
                  : "background.paper",
                transition: "background-color 0.3s ease",
              }}
            >
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Current Risk Adjust
                </Typography>
                <Typography variant="h5">
                  {riskAdjustBps != null
                    ? `${riskAdjustBps.toFixed(0)} Bps`
                    : "—"}
                </Typography>
              </Box>
              {riskAdjustUpdatedAt && (
                <Typography variant="caption" color="text.secondary">
                  Updated at{" "}
                  {riskAdjustUpdatedAt.toLocaleTimeString(undefined, {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </Typography>
              )}
            </Paper>
          </Box>

          {/* Ações */}
          <Stack
            direction="row"
            spacing={3}
            justifyContent="center"
            marginTop={5}
            flexWrap="wrap"
          >
            <Button
              variant="outlined"
              color="primary"
              onClick={handleShowRiskAdjust}
            >
              Get Risk Adjust
            </Button>
            <Button
              variant="outlined"
              color="error"
              onClick={handleRiskAdjustReset}
            >
              Reset Risk Adjust
            </Button>
            <Button variant="contained" color="primary" onClick={handleSave}>
              Save
            </Button>
            <Button
              variant="outlined"
              color="success"
              onClick={handleStart}
            >
              Start
            </Button>
            <Button variant="outlined" color="error" onClick={handleStop}>
              Stop
            </Button>
            <Button
              variant="outlined"
              onClick={handleCloseOrders}
            >
              Close Orders
            </Button>
            <Button
              onClick={() => setUpdateSocket(!updateSocket)}
              variant="outlined"
              color="primary"
            >
              Reconnect Socket
            </Button>
          </Stack>

          {/* Card de preços (quando API mandar Status: "prices") */}
          {prices && (
            <Box mt={4}>
              <Paper elevation={1} sx={{ p: 2 }}>
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  gutterBottom
                >
                  Price preview (after saving spreads)
                </Typography>

                <Stack direction="row" spacing={4} flexWrap="wrap">
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Main book
                    </Typography>
                    <Typography variant="body2">
                      Ask: <strong>{ask}</strong>
                    </Typography>
                    <Typography variant="body2">
                      Bid: <strong>{bid}</strong>
                    </Typography>
                    <Typography variant="body2">
                      Spread: <strong>{spread}</strong>
                    </Typography>
                  </Box>

                  {formData.ThiefOrder && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Thief book
                      </Typography>
                      <Typography variant="body2">
                        Thief Ask: <strong>{thiefAsk}</strong>
                      </Typography>
                      <Typography variant="body2">
                        Thief Bid: <strong>{thiefBid}</strong>
                      </Typography>
                    </Box>
                  )}
                </Stack>
              </Paper>
            </Box>
          )}
        </Paper>

        {/* Barra de status de conexão em forma de Alert (opcional) */}
        <Box mt={2}>
          <Alert severity={connectionSeverity}>{connectionText}</Alert>
        </Box>

        {/* NOTIFICAÇÕES (bottom-right) */}
        <Box
          sx={{
            position: "fixed",
            bottom: 16,
            right: 16,
            zIndex: 1300,
            width: 320,
          }}
        >
          {notifications.map((n) => (
            <Alert
              key={n.id}
              severity={n.type}
              onClose={() => removeNotification(n.id)}
              sx={{ mb: 1 }}
            >
              {n.message}
            </Alert>
          ))}
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default App;
