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
  const [wsMessage, setWsMessage] = useState({ Status: "", Message: "" });
  const [botRunning, setBotRunning] = useState(false);
  const [updateSocket, setUpdateSocket] = useState(false);
  const [prices, setPrices] = useState(false);
  const [ask, setAsk] = useState("");
  const [bid, setBid] = useState("");
  const [thiefAsk, setThiefAsk] = useState("");
  const [thiefBid, setThiefBid] = useState("");
  const [spread, setSpread] = useState("");
  const [contracts, setContracts] = useState(0);
  const [env, setEnv] = useState("prod");

  // ---- RISK ADJUST STATE ----
  const [riskAdjust, setRiskAdjust] = useState(null); // valor bruto vindo da API
  const [riskAdjustUpdatedAt, setRiskAdjustUpdatedAt] = useState(null);
  const [riskAdjustHighlight, setRiskAdjustHighlight] = useState(false);

  // valor em BPS (exibido na UI)
  const riskAdjustBps = riskAdjust != null ? riskAdjust * 10000 : null;

  // WebSocket
  useEffect(() => {
    const ws = new WebSocket(
      `ws://13.231.10.120:${env === "dev" ? 5050 : 7070}/ws`
    );
    setSocket(ws);

    ws.onopen = () => {
      console.log("WebSocket conectado");
      setWsMessage({ Status: "success", Message: "WebSocket connected" });
    };

    ws.onerror = (error) => console.error("Erro no WebSocket:", error);

    ws.onclose = () => {
      console.log("WebSocket desconectado");
      setWsMessage({ Status: "error", Message: "WebSocket diconnected" });
      setBotRunning(false);
    };

    ws.onmessage = async (event) => {
      const message = JSON.parse(event.data);
      console.log("Mensagem recebida:", message);

      // Preços
      if (message.Status === "prices") {
        setPrices(true);
        setAsk(message.Ask);
        setBid(message.Bid);
        setThiefAsk(message.ThiefAsk);
        setThiefBid(message.ThiefBid);
        setSpread(message.Spread);
      }

      // Risk Adjust (showriskadjust)
      if (message.Status === "showriskadjust") {
        const value = Number(message.Value ?? 0);
        setRiskAdjust(value);
        setRiskAdjustUpdatedAt(new Date());
        setRiskAdjustHighlight(true);
        setTimeout(() => {
          setRiskAdjustHighlight(false);
        }, 2000);
      }

      // Status do bot
      if (message.Status === "success" && message.Message?.includes("running")) {
        setBotRunning(true);
      }

      if (
        message.Status === "success" &&
        message.Message?.includes("stopped")
      ) {
        setBotRunning(false);
      }

      setWsMessage(message);
    };

    return () => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [env, updateSocket]);

  // ---- HANDLERS ----
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    console.log("Infos: " + name + ", " + value + ", " + type + ", " + checked);

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
    }
  };

  const handleSave = () => {
    const payload = {
      Type: "params",
      Data: formData,
    };
    console.log(payload);
    sendMessage(payload);
  };

  const handleStart = () => {
    const payload = {
      Type: "text",
      Data: { Text: "start" },
    };
    sendMessage(payload);
    setPrices(false);
  };

  const handleStop = () => {
    const payload = {
      Type: "text",
      Data: { Text: "stop" },
    };
    sendMessage(payload);
  };

  const handleCloseOrders = () => {
    const payload = {
      Type: "text",
      Data: { Text: "cancelorders" },
    };
    sendMessage(payload);
  };

  const handleRiskAdjustReset = () => {
    const payload = {
      Type: "riskadjust",
      Data: {
        value: 0,
      },
    };
    sendMessage(payload);
  };

  const handleShowRiskAdjust = () => {
    const payload = {
      Type: "showriskadjust",
    };
    sendMessage(payload);
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

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ padding: 4, maxWidth: 1500, margin: "0 auto" }}>
        <Paper elevation={3} sx={{ padding: 4 }}>
          {/* Status do Bot */}
          <div
            style={{
              maxWidth: "10%",
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div
              style={{
                width: 15,
                height: 15,
                borderRadius: 25,
                background: botRunning ? "green" : "red",
              }}
            />
            <p style={{ color: botRunning ? "green" : "red" }}>
              {botRunning ? "Bot is running" : "Bot is stopped"}
            </p>
          </div>

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

          {/* Thief Order */}
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

          {/* Infos de preço */}
          <div>
            {prices && (
              <p style={{ color: "black" }}>
                Ask: {ask} , Bid: {bid} , Spread: {spread}
              </p>
            )}
          </div>
          <div>
            {prices && formData.ThiefOrder && (
              <p style={{ color: "black" }}>
                ThiefAsk: {thiefAsk} , ThiefBid: {thiefBid}
              </p>
            )}
          </div>
        </Paper>

        {/* Mensagens gerais do socket (log / status) */}
        {wsMessage?.Message &&
          wsMessage.Status !== "showriskadjust" && (
            <Alert
              severity={wsMessage.Status === "error" ? "error" : "success"}
              sx={{ mt: 3 }}
            >
              {wsMessage.Message}
            </Alert>
          )}
      </Box>
    </ThemeProvider>
  );
};

export default App;
