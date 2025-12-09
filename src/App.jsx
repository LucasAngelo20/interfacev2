import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Chip,
  Snackbar,
  Alert,
  Divider,
  Grid,
} from "@mui/material";
import { ThemeProvider, createTheme } from "@mui/material/styles";

const API_HOST = import.meta.env.VITE_API_HOST || "localhost";
const API_DEV_PORT = import.meta.env.VITE_API_DEV_PORT || "5050";
const API_PROD_PORT = import.meta.env.VITE_API_PROD_PORT || "7070";
const APP_ENV = import.meta.env.VITE_APP_ENV || "prod";
const APP_VERSION = import.meta.env.VITE_APP_VERSION || "0.1.0";

const theme = createTheme({
  palette: {
    primary: { main: "#1976d2" },
    success: { main: "#2e7d32" },
    error: { main: "#d32f2f" },
    warning: { main: "#ed6c02" },
    info: { main: "#0288d1" },
  },
});

const formatDateTime = (d) =>
  d ? d.toLocaleString("pt-BR", { hour12: false }) : "—";

const App = () => {
  const [formData, setFormData] = useState({
    Side: "both",
    SpreadRiskAdjBps: "0",
    SpreadBuyBps: "0",
    SpreadSellBps: "0",
    OrderSizeDol: "30000",
    ThiefOrder: false,
    ThiefSpreadBuyBps: "0",
    ThiefSpreadSellBps: "0",
    ThiefOrderSizeDol: "30000",
    ToleranceBps: "2",
  });

  const [socket, setSocket] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [reconnectKey, setReconnectKey] = useState(0);

  const [botRunning, setBotRunning] = useState(false);

  // Risk Adjust
  const [riskAdjust, setRiskAdjust] = useState(null); // fração, ex: 0.0003
  const [riskAdjustUpdatedAt, setRiskAdjustUpdatedAt] = useState(null);
  const [riskAdjustHighlight, setRiskAdjustHighlight] = useState(false);

  // Prices
  const [pricePreview, setPricePreview] = useState({
    hasData: false,
    ask: null,
    bid: null,
    thiefAsk: null,
    thiefBid: null,
    spread: null,
    spreadBuy: null,
    spreadSell: null,
    thiefSpreadBuy: null,
    thiefSpreadSell: null,
  });
  const [priceUpdatedAt, setPriceUpdatedAt] = useState(null);

  // Notifications
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarConfig, setSnackbarConfig] = useState({
    severity: "info",
    message: "",
  });

  const API_PORT = APP_ENV === "dev" ? API_DEV_PORT : API_PROD_PORT;

  const wsUrl = useMemo(
    () => `ws://${API_HOST}:${API_PORT}/ws`,
    [API_HOST, API_PORT]
  );

  const showNotification = (severity, message) => {
    if (!message) return;
    setSnackbarConfig({ severity, message });
    setSnackbarOpen(true);
  };

  const handleCloseSnackbar = (_, reason) => {
    if (reason === "clickaway") return;
    setSnackbarOpen(false);
  };

  // WebSocket lifecycle
  useEffect(() => {
    const ws = new WebSocket(wsUrl);
    setSocket(ws);

    ws.onopen = () => {
      console.log("WebSocket conectado");
      setSocketConnected(true);
      showNotification("success", "WebSocket connected");
    };

    ws.onclose = () => {
      console.log("WebSocket desconectado");
      setSocketConnected(false);
      showNotification("error", "WebSocket disconnected");
    };

    ws.onerror = (err) => {
      console.error("Erro no WebSocket:", err);
      showNotification("error", "WebSocket error");
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log("Mensagem recebida:", message);

        switch (message.Status) {
          case "botstatus":
            if (typeof message.BotRunning === "boolean") {
              setBotRunning(message.BotRunning);
            }
            if (message.Message) {
              showNotification("info", message.Message);
            }
            break;

          case "prices":
            setPricePreview({
              hasData: true,
              ask: message.Ask ?? null,
              bid: message.Bid ?? null,
              thiefAsk: message.ThiefAsk ?? null,
              thiefBid: message.ThiefBid ?? null,
              spread: message.Spread ?? null,
              spreadBuy: message.SpreadBuy ?? null,
              spreadSell: message.SpreadSell ?? null,
              thiefSpreadBuy: message.ThiefSpreadBuy ?? null,
              thiefSpreadSell: message.ThiefSpreadSell ?? null,
            });
            setPriceUpdatedAt(new Date());
            break;

          case "riskadjust":
            if (typeof message.Value === "number") {
              setRiskAdjust(message.Value);
              setRiskAdjustUpdatedAt(new Date());
              setRiskAdjustHighlight(true);
              setTimeout(() => setRiskAdjustHighlight(false), 1500);
            }
            if (message.Message) {
              showNotification("info", message.Message);
            }
            break;

          case "success":
            if (message.Message) {
              showNotification("success", message.Message);
            }
            break;

          case "error":
            showNotification("error", message.Message || "Unknown error");
            break;

          case "message":
            if (message.Message) {
              showNotification("info", message.Message);
            }
            break;

          default:
            showNotification(
              "warning",
              `Unknown status from server: ${message.Status}`
            );
            break;
        }
      } catch (e) {
        console.error("Erro ao parsear mensagem:", e);
        showNotification("error", "Error parsing WebSocket message");
      }
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [wsUrl, reconnectKey]);

  // Enviar mensagem pelo WS
  const sendMessage = (msg) => {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      console.error("WebSocket não está conectado");
      showNotification("error", "WebSocket is not connected");
      return;
    }
    socket.send(JSON.stringify(msg));
  };

  // Handlers de formulário
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "ThiefOrder") {
      setFormData((prev) => ({ ...prev, [name]: value === "true" }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = () => {
    const payload = {
      Type: "params",
      Data: {
        // Symbol fixo: USD (backend espera esse campo)
        Symbol: "USD",
        Side: formData.Side,
        SpreadRiskAdjBps: formData.SpreadRiskAdjBps,
        SpreadBuyBps: formData.SpreadBuyBps,
        SpreadSellBps: formData.SpreadSellBps,
        OrderSizeDol: formData.OrderSizeDol,
        ThiefOrder: formData.ThiefOrder,
        ThiefSpreadBuyBps: formData.ThiefSpreadBuyBps,
        ThiefSpreadSellBps: formData.ThiefSpreadSellBps,
        ThiefOrderSizeDol: formData.ThiefOrderSizeDol,
        ToleranceBps: formData.ToleranceBps,
      },
    };
    sendMessage(payload);
  };

  const handleStart = () => {
    sendMessage({
      Type: "text",
      Data: { Text: "start" },
    });
    // botRunning é atualizado pela mensagem "botstatus"
  };

  const handleStop = () => {
    sendMessage({
      Type: "text",
      Data: { Text: "stop" },
    });
  };

  const handleRiskAdjustReset = () => {
    sendMessage({
      Type: "riskadjust",
      Data: { value: 0 },
    });
  };

  const handleShowRiskAdjust = () => {
    sendMessage({
      Type: "showriskadjust",
    });
  };

  const handleReconnect = () => {
    setReconnectKey((k) => k + 1);
  };

  const riskAdjustBps = riskAdjust != null ? riskAdjust * 10000 : null;

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ p: 4, maxWidth: 1400, mx: "auto" }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          {/* Top bar: conexão + bot status + reconnect */}
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            mb={3}
            spacing={2}
          >
            <Stack direction="row" spacing={2} alignItems="center">
              <Chip
                label={socketConnected ? "WebSocket Connected" : "Disconnected"}
                color={socketConnected ? "success" : "error"}
                variant={socketConnected ? "filled" : "outlined"}
              />
              <Chip
                label={botRunning ? "Bot is running" : "Bot is stopped"}
                color={botRunning ? "success" : "error"}
                variant="filled"
              />
              <Typography variant="caption" color="text.secondary">
                Env: {APP_VERSION}
              </Typography>
            </Stack>

            <Button
              variant="outlined"
              color="primary"
              onClick={handleReconnect}
            >
              Reconnect
            </Button>
          </Stack>

          <Typography variant="h4" textAlign="center" gutterBottom>
            Binance Configuration
          </Typography>

          <Divider sx={{ my: 3 }} />

          {/* Form em colunas (sem Symbol) */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle1" gutterBottom>
                General
              </Typography>

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id="side-label">Side</InputLabel>
                <Select
                  labelId="side-label"
                  name="Side"
                  value={formData.Side}
                  label="Side"
                  onChange={handleChange}
                >
                  <MenuItem value="buy">Buy</MenuItem>
                  <MenuItem value="sell">Sell</MenuItem>
                  <MenuItem value="both">Both</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id="thief-label">Thief Order</InputLabel>
                <Select
                  labelId="thief-label"
                  name="ThiefOrder"
                  value={String(formData.ThiefOrder)}
                  label="Thief Order"
                  onChange={handleChange}
                >
                  <MenuItem value="true">Enabled</MenuItem>
                  <MenuItem value="false">Disabled</MenuItem>
                </Select>
              </FormControl>

              <TextField
                fullWidth
                sx={{ mb: 2 }}
                label="Tolerance (Bps)"
                name="ToleranceBps"
                type="number"
                value={formData.ToleranceBps}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <Typography variant="subtitle1" gutterBottom>
                Spreads
              </Typography>

              <TextField
                fullWidth
                sx={{ mb: 2 }}
                label="Spread Risk Adjust (Bps)"
                name="SpreadRiskAdjBps"
                type="number"
                value={formData.SpreadRiskAdjBps}
                onChange={handleChange}
              />
              <TextField
                fullWidth
                sx={{ mb: 2 }}
                label="Spread Buy (Bps)"
                name="SpreadBuyBps"
                type="number"
                value={formData.SpreadBuyBps}
                onChange={handleChange}
              />
              <TextField
                fullWidth
                sx={{ mb: 2 }}
                label="Spread Sell (Bps)"
                name="SpreadSellBps"
                type="number"
                value={formData.SpreadSellBps}
                onChange={handleChange}
              />

              <TextField
                fullWidth
                sx={{ mb: 2 }}
                label="Order Size (Dol $)"
                name="OrderSizeDol"
                type="number"
                value={formData.OrderSizeDol}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <Typography variant="subtitle1" gutterBottom>
                Thief Config
              </Typography>

              <TextField
                fullWidth
                sx={{ mb: 2 }}
                label="Thief Spread Buy (Bps)"
                name="ThiefSpreadBuyBps"
                type="number"
                value={formData.ThiefSpreadBuyBps}
                onChange={handleChange}
                disabled={!formData.ThiefOrder}
              />
              <TextField
                fullWidth
                sx={{ mb: 2 }}
                label="Thief Spread Sell (Bps)"
                name="ThiefSpreadSellBps"
                type="number"
                value={formData.ThiefSpreadSellBps}
                onChange={handleChange}
                disabled={!formData.ThiefOrder}
              />
              <TextField
                fullWidth
                sx={{ mb: 2 }}
                label="Thief Order Size (Dol $)"
                name="ThiefOrderSizeDol"
                type="number"
                value={formData.ThiefOrderSizeDol}
                onChange={handleChange}
                disabled={!formData.ThiefOrder}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          {/* Cards: Risk + Price Preview */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  borderColor: riskAdjustHighlight ? "success.main" : "divider",
                  transition: "border-color 0.3s",
                }}
              >
                <Typography variant="subtitle1" gutterBottom>
                  Current Risk Adjust
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  {riskAdjustBps != null
                    ? `${riskAdjustBps.toFixed(2)} Bps`
                    : "—"}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  display="block"
                  sx={{ mt: 1 }}
                >
                  Last update: {formatDateTime(riskAdjustUpdatedAt)}
                </Typography>

                <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleShowRiskAdjust}
                  >
                    Refresh
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    color="error"
                    onClick={handleRiskAdjustReset}
                  >
                    Reset
                  </Button>
                </Stack>
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Price Preview (USD)
                </Typography>

                <Box sx={{ mt: 1, display: "flex", gap: 4 }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Ask:
                    </Typography>
                    <Typography variant="h6">
                      {pricePreview.ask != null ? pricePreview.ask : "—"}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Thief Ask:
                    </Typography>
                    <Typography variant="body2">
                      {pricePreview.thiefAsk != null
                        ? pricePreview.thiefAsk
                        : "—"}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Bid:
                    </Typography>
                    <Typography variant="h6">
                      {pricePreview.bid != null ? pricePreview.bid : "—"}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Thief Bid:
                    </Typography>
                    <Typography variant="body2">
                      {pricePreview.thiefBid != null
                        ? pricePreview.thiefBid
                        : "—"}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Spread:
                    </Typography>
                    <Typography variant="h6">
                      {pricePreview.spread != null
                        ? pricePreview.spread
                        : "—"}
                    </Typography>
                  </Box>
                </Box>

                <Typography
                  variant="caption"
                  color="text.secondary"
                  display="block"
                  sx={{ mt: 1 }}
                >
                  Last update: {formatDateTime(priceUpdatedAt)}
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          {/* Botões principais */}
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            justifyContent="center"
          >
            <Button variant="contained" color="primary" onClick={handleSave}>
              Save Params
            </Button>
            <Button
              variant="outlined"
              color="success"
              onClick={handleStart}
              disabled={botRunning}
            >
              Start
            </Button>
            <Button
              variant="outlined"
              color="error"
              onClick={handleStop}
              disabled={!botRunning}
            >
              Stop
            </Button>
          </Stack>
        </Paper>

        {/* Snackbar de notificações */}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={4000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            onClose={handleCloseSnackbar}
            severity={snackbarConfig.severity}
            variant="filled"
            sx={{ width: "100%" }}
          >
            {snackbarConfig.message}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
};

export default App;
