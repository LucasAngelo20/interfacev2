import React, { useState, useEffect } from "react";
import {
  Box,
  TextField,
  Checkbox,
  Button,
  FormControlLabel,
  Typography,
  Paper,
  Stack,
  CssBaseline,
  Select,
} from "@mui/material";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import MenuItem from "@mui/material/MenuItem";
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';




const App = () => {
  const [formData, setFormData] = useState({
    Side: "both",
    Symbol: "USD",
    MaxPosition: "1000000",
    SpreadRiskAdjBps: "0",
    SpreadBuyBps: "0",
    SpreadSellBps: "0",
    OrderSizeDolBuy: "100000",
    OrderSizeDolSell: "100000",
    ThiefSpreadBuyBps: "0",
    ThiefSpreadSellBps: "0",
    ThiefOrderSizeDolBuy: "100000",
    ThiefOrderSizeDolSell: "100000",
    ToleranceBps: "2",
    Parse: false,
  });

  const [socket, setSocket] = useState(null);
  const [wsMessage, setWsMessage] = useState("");
  const [botRunning, setBotRunning] = useState(false);
  const [thiefOrder, setThiefOrder] = useState(false);
  const [updateSocket, setUpdateSocket] = useState(false);
  const [prices, setPrices] = useState(false);
  const [ask, setAsk] = useState("");
  const [bid, setBid] = useState("");
  const [thiefAsk, setThiefAsk] = useState("");
  const [thiefBid, setThiefBid] = useState("");
  const [spread, setSpread] = useState("");

  useEffect(() => {
    const ws = new WebSocket("ws://13.231.10.120:7070/ws");
    setSocket(ws);

    ws.onopen = () => {
      console.log("WebSocket conectado");
      setWsMessage({ Status: "success", Message: "WebSocket connected" })
    }
    ws.onerror = (error) => console.error("Erro no WebSocket:", error);
    ws.onclose = () => {
      console.log("WebSocket desconectado")
      setWsMessage({ Status: "error", Message: "WebSocket diconnected" })
      setBotRunning(false)
    }
    ws.onmessage = async (event) => {
      const message = JSON.parse(event.data);
      console.log("Mensagem recebida:", message);
      if (message.Status === "success" && message.Message.includes("running")) {
        setBotRunning(true);
      }
      if (message.Status === "success" && message.Message.includes("stopped")) {
        setBotRunning(false);
      }
      setWsMessage(message);

    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, []);

  useEffect(() => {
    const ws = new WebSocket("ws://13.231.10.120:7070/ws");
    setSocket(ws);
    if (ws != null) {
      ws.onopen = () => {
        console.log("WebSocket conectado");
        setWsMessage({ Status: "success", Message: "WebSocket connected" })
      }

      ws.onclose = () => {
        console.log("WebSocket desconectado")
        setWsMessage({ Status: "error", Message: "WebSocket diconnected" })
        setBotRunning(false)
      }
      ws.onerror = (error) => console.error("Erro no WebSocket:", error);
      ws.onmessage = async (event) => {
        const message = JSON.parse(event.data);
        console.log("Mensagem recebida:", message);
        if (message.Status === "prices") {
          setPrices(true)
          setAsk(message.Ask)
          setBid(message.Bid)
          setThiefAsk(message.ThiefAsk)
          setThiefBid(message.ThiefBid)
          setSpread(message.Spread)
          // setMessage(message)
        }
        if (message.Status === "success" && message.Message.includes("running")) {
          setBotRunning(true);
        }
        if (message.Status === "success" && message.Message.includes("stopped")) {
          setBotRunning(false);
        }
        setWsMessage(message);

      };
    }

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [updateSocket]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    console.log("Infos: " + name + ", " + value + ", " + type + ", " + checked);
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : type === "text"
            ? value
            : name === "Side"
              ? String(value)
              : name === "ThiefOrder"
                ? setThiefOrder(value)
                : name === "Symbol"
                  ? String(value)
                  : value
      ,
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
      Data: {
        Side: formData.Side,
        Symbol: formData.Symbol,
        ThiefOrder: thiefOrder,
        MaxPosition: formData.MaxPosition,
        SpreadRiskAdjBps: formData.SpreadRiskAdjBps,
        SpreadBuyBps: formData.SpreadBuyBps,
        SpreadSellBps: formData.SpreadSellBps,
        OrderSizeDolBuy: formData.OrderSizeDolBuy,
        OrderSizeDolSell: formData.OrderSizeDolSell,
        ThiefSpreadBuyBps: formData.ThiefSpreadBuyBps,
        ThiefSpreadSellBps: formData.ThiefSpreadSellBps,
        ThiefOrderSizeDolBuy: formData.ThiefOrderSizeDolBuy,
        ThiefOrderSizeDolSell: formData.ThiefOrderSizeDolSell,
        ToleranceBps: formData.ToleranceBps,
        Parse: formData.Parse,
      },
    };
    console.log(payload);
    sendMessage(payload);
  };

  const handleStart = () => {
    const payload = {
      Type: "text",
      Data: {
        Text: "start",
      },
    };
    sendMessage(payload);
    setPrices(false)
  };

  const handleStop = () => {
    const payload = {
      Type: "text",
      Data: {
        Text: "stop",
      },
    };
    sendMessage(payload);
  };
  const handleCloseOrders = () => {
    const payload = {
      Type: "text",
      Data: {
        Text: "cancelorders",
      },
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
      <Box sx={{ padding: 4, maxWidth: 600, margin: "0 auto" }}>
        <Paper elevation={3} sx={{ padding: 4 }}>
          <div
            style={{
              width: 15,
              height: 15,
              borderRadius: 25,
              background: botRunning ? "green" : "red",
            }}
          />
          <Typography variant="h4" gutterBottom textAlign="center">
            Binance Configuration
          </Typography>
          <Button fullWidth style={{ alignSelf: "center", margin: "0 0 20px 0" }} onClick={() => setUpdateSocket(!updateSocket)}>Reconnect socket </Button>

          <FormControl fullWidth>
            <InputLabel id="SymbolId">Asset</InputLabel>
            <Select
              label="Symbol"
              labelId="SymbolId"
              name="Symbol"
              id="SymbolId"
              value={FormData.Symbol}
              onChange={handleChange}
              style={{ margin: "0 0 40px 0" }}
            >
              <MenuItem value={"BTC"}>BTC</MenuItem>
              <MenuItem value={"USD"}>USD</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel id="SideId">Side</InputLabel>
            <Select
              labelId="SideId"
              name="Side"
              id="SideId"
              value={FormData.Side}
              label="Side"
              onChange={handleChange}
              style={{ margin: "0 0 40px 0" }}

            >
              <MenuItem type="select" value={"buy"}>Buy</MenuItem>
              <MenuItem type="select" value={"sell"}>Sell</MenuItem>
              <MenuItem type="select" value={"both"}>Both</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel id="ThiefOrderId">Thief order</InputLabel>

            <Select
              labelId="ThiefOrderId"
              name="ThiefOrder"
              id="ThiefOrderId"
              value={FormData.ThiefOrder}
              label="ThiefOrder"
              type="select"
              onChange={handleChange}
              style={{ margin: "0 0 40px 0" }}
            >
              <MenuItem type="select" value={true}>Enabled</MenuItem>
              <MenuItem type="select" value={false}>Disabled</MenuItem>
            </Select>
          </FormControl>

          <TextField
            style={{ margin: "0 0 40px 0" }}
            label="Max Position(Dol)"
            name="MaxPosition"
            type="text"
            value={formData.MaxPosition}
            onChange={handleChange}
            fullWidth

          />
          <TextField
            style={{ margin: "0 0 40px 0" }}
            label="Spread Risk AdjBps"
            name="SpreadRiskAdjBps"
            type="text"
            disabled
            value={formData.SpreadRiskAdjBps}
            onChange={handleChange}
            fullWidth
          />
          <TextField
            style={{ margin: "0 0 40px 0" }}
            label="Spread Buy (Bps)"
            name="SpreadBuyBps"
            type="text"

            value={formData.SpreadBuyBps}
            onChange={handleChange}
            fullWidth
          />
          <TextField
            style={{ margin: "0 0 40px 0" }}
            label="Spread Sell (Bps)"
            name="SpreadSellBps"
            type="text"

            value={formData.SpreadSellBps}
            onChange={handleChange}
            fullWidth
          />
          <TextField
            style={{ margin: "0 0 40px 0" }}
            label="Order Size (Buy $)"
            name="OrderSizeDolBuy"
            type="text"

            value={formData.OrderSizeDolBuy}
            onChange={handleChange}
            fullWidth
          />
          <TextField
            style={{ margin: "0 0 40px 0" }}
            label="Order Size (Sell $)"
            name="OrderSizeDolSell"
            type="text"

            value={formData.OrderSizeDolSell}
            onChange={handleChange}
            fullWidth
          />
          <TextField
            style={{ margin: "0 0 40px 0" }}
            label="Tolerance (Bps)"
            name="ToleranceBps"
            type="text"

            value={formData.ToleranceBps}
            onChange={handleChange}
            fullWidth
          />
          {thiefOrder && (
            <>
              <TextField
                style={{ margin: "0 0 40px 0" }}
                label="Thief Spread Buy (Bps)"
                name="ThiefSpreadBuyBps"
                type="text"

                value={formData.ThiefSpreadBuyBps}
                onChange={handleChange}
                fullWidth
              />
              <TextField
                style={{ margin: "0 0 40px 0" }}
                label="Thief Spread Sell (Bps)"
                name="ThiefSpreadSellBps"
                type="text"

                value={formData.ThiefSpreadSellBps}
                onChange={handleChange}
                fullWidth
              />
              <TextField
                style={{ margin: "0 0 40px 0" }}
                label="Thief Order Size (Buy $)"
                name="ThiefOrderSizeDolBuy"
                type="text"

                value={formData.ThiefOrderSizeDolBuy}
                onChange={handleChange}
                fullWidth
              />
              <TextField
                style={{ margin: "0 0 40px 0" }}
                label="Thief Order Size (Sell $)"
                name="ThiefOrderSizeDolSell"
                type="text"

                value={formData.ThiefOrderSizeDolSell}
                onChange={handleChange}
                fullWidth
              />
            </>
          )}
          <FormControlLabel
            control={
              <Checkbox
                name="Parse"
                checked={formData.Parse}
                onChange={handleChange}
              />
            }
            label="Partially-filled"
          />
          <Stack direction="row" spacing={3} justifyContent="center" marginTop={5}>
            <Button variant="contained" color="primary" onClick={handleSave}>
              Save
            </Button>
            <Button variant="outlined" color="success" onClick={handleStart}>
              Start
            </Button>
            <Button variant="outlined" color="error" onClick={handleStop}>
              Stop
            </Button>
            <Button
              variant="outlined"
              color="error"
              onClick={handleCloseOrders}
            >
              Close all orders
            </Button>

          </Stack>
          <div>
          {prices && (
            <p
              style={{color: "black" }}
            >
              Ask: {ask}{" "},
              Bid: {bid}{" "},
              Spread: {spread}{" "}
            </p>
          )}
        </div>
          <div>
          {prices && thiefOrder && (
            <p
              style={{color: "black" }}
            >
              ThiefAsk: {thiefAsk}{" "},
              ThiefBid: {thiefBid}{" "},
            </p>
          )}
        </div>
        </Paper>

        <div>
          {wsMessage && (
            <p
              style={{ color: wsMessage.Status === "error" ? "red" : "green" }}
            >
              {wsMessage.Message}
            </p>
          )}
        </div>

      </Box>
    </ThemeProvider>
  );
};

export default App;
