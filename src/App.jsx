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
  Tabs,
  Tab,
} from "@mui/material";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import MenuItem from "@mui/material/MenuItem";
import InputLabel from "@mui/material/InputLabel";
import FormControl from "@mui/material/FormControl";

const App = () => {
  const [formData, setFormData] = useState({
    Exchange: "binance",
    Side: "both",
    Symbol: "USD",
    MaxPosition: "1000000",
    SpreadRiskAdjBps: "0",
    SpreadBuyBps: "0",
    SpreadSellBps: "0",
    OrderSizeDolBuy: "100000",
    OrderSizeDolSell: "100000",
    ThiefOrder: "false",
    ThiefSpreadBuyBps: "0",
    ThiefSpreadSellBps: "0",
    ThiefOrderSizeDolBuy: "100000",
    ThiefOrderSizeDolSell: "100000",
    ToleranceBps: "2",
    Contracts: "0",
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
  const [contracts, setContracts] = useState(0);
  const [binanceParams, setBinanceParams] = useState({
    Exchange: "binance",
    Side: "both",
    Symbol: "USD",
    MaxPosition: "1000000",
    SpreadRiskAdjBps: "0",
    SpreadBuyBps: "0",
    SpreadSellBps: "0",
    OrderSizeDolBuy: "50000",
    OrderSizeDolSell: "50000",
    ThiefOrder: "false",
    ThiefSpreadBuyBps: "-5",
    ThiefSpreadSellBps: "5",
    ThiefOrderSizeDolBuy: "50000",
    ThiefOrderSizeDolSell: "50000",
    ToleranceBps: "2",
    Contracts: "0",
  });
  const [bybitParams, setBybitParams] = useState({
    Exchange: "bybit",
    Side: "both",
    Symbol: "USD",
    MaxPosition: "20000",
    SpreadRiskAdjBps: "0",
    SpreadBuyBps: "0",
    SpreadSellBps: "0",
    OrderSizeDolBuy: "10000",
    OrderSizeDolSell: "10000",
    ThiefOrder: "false",
    ThiefSpreadBuyBps: "0",
    ThiefSpreadSellBps: "0",
    ThiefOrderSizeDolBuy: "100000",
    ThiefOrderSizeDolSell: "100000",
    ToleranceBps: "2",
    Contracts: "0",
  });

  useEffect(() => {
    const ws = new WebSocket("ws://13.231.10.120:7070/ws");
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
        setWsMessage({ Status: "success", Message: "WebSocket connected" });
      };

      ws.onclose = () => {
        console.log("WebSocket desconectado");
        setWsMessage({ Status: "error", Message: "WebSocket diconnected" });
        setBotRunning(false);
      };
      ws.onerror = (error) => console.error("Erro no WebSocket:", error);
      ws.onmessage = async (event) => {
        const message = JSON.parse(event.data);
        console.log("Mensagem recebida:", message);
        if (message.Status === "prices") {
          setPrices(true);
          setAsk(message.Ask);
          setBid(message.Bid);
          setThiefAsk(message.ThiefAsk);
          setThiefBid(message.ThiefBid);
          setSpread(message.Spread);
          // setMessage(message)
        }
        // if (message.Status === "binance") {
        //   const Data = {
        //     Exchange: message.Status.toString(),
        //     Contracts:  message.Message.Contracts.toString(),
        //     Side: message.Message.Side.toString(),
        //     Symbol: message.Message.Coin.toString(),
        //     ThiefOrder: message.Message.ThiefOrder.toString(),
        //     MaxPosition: "0",
        //     SpreadRiskAdjBps: message.Message.SpreadRiskAdjBps.toString(),
        //     SpreadBuyBps: message.Message.SpreadBuyBps.toString(),
        //     SpreadSellBps: message.Message.SpreadSellBps.toString(),
        //     OrderSizeDolBuy: message.Message.OrderSizeDolBuy.toString(),
        //     OrderSizeDolSell: message.Message.OrderSizeDolSell.toString(),
        //     ThiefSpreadBuyBps: message.Message.ThiefSpreadBuyBps.toString(),
        //     ThiefSpreadSellBps: message.Message.ThiefSpreadSellBps.toString(),
        //     ThiefOrderSizeDolBuy: message.Message.ThiefOrderSizeDolBuy.toString(),
        //     ThiefOrderSizeDolSell: message.Message.ThiefOrderSizeDolSell.toString(),
        //     ToleranceBps: message.Message.ToleranceBps.toString(),
        //   }
        //   console.log(Data)
        //   setFormData(Data)
        // }else if (message.Status === "bybit") {
        //   const Data = {
        //     Exchange: message.Status.toString(),
        //     Contracts: message.Message.Contracts.toString(),
        //     Side: message.Message.Side.toString(),
        //     Symbol: message.Message.Coin.toString(),
        //     ThiefOrder: message.Message.ThiefOrder.toString(),
        //     MaxPosition: "0",
        //     SpreadRiskAdjBps: message.Message.SpreadRiskAdjBps.toString(),
        //     SpreadBuyBps: message.Message.SpreadBuyBps.toString(),
        //     SpreadSellBps: message.Message.SpreadSellBps.toString(),
        //     OrderSizeDolBuy: message.Message.OrderSizeDolBuy.toString(),
        //     OrderSizeDolSell: message.Message.OrderSizeDolSell.toString(),
        //     ThiefSpreadBuyBps: message.Message.ThiefSpreadBuyBps.toString(),
        //     ThiefSpreadSellBps: message.Message.ThiefSpreadSellBps.toString(),
        //     ThiefOrderSizeDolBuy: message.Message.ThiefOrderSizeDolBuy.toString(),
        //     ThiefOrderSizeDolSell: message.Message.ThiefOrderSizeDolSell.toString(),
        //     ToleranceBps: message.Message.ToleranceBps.toString(),
        //   }
        //   console.log(Data)
        //   setFormData(Data)
        // }

        if (
          message.Status === "success" &&
          message.Message.includes("running")
        ) {
          setBotRunning(true);
        }
        if (
          message.Status === "success" &&
          message.Message.includes("stopped")
        ) {
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

  const handleChangeBinance = (e) => {
    const { name, value, type, checked } = e.target;
    console.log("Infos binance: " + name + ", " + value + ", " + type + ", " + checked);
    console.log("Thief: " + binanceParams);
    setBinanceParams((prev) => ({
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
          : value,
    }));
  };
  const handleChangeBybit = (e) => {
    const { name, value, type, checked } = e.target;
    console.log("Infos bybit: " + name + ", " + value + ", " + type + ", " + checked);
    setBybitParams((prev) => ({
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
          : value,
    }));
  };
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
          : value,
    }));
    handleChangeBinance(e);
    handleChangeBinance(e);
  };

  const sendMessage = (message) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    } else {
      console.error("WebSocket não está conectado");
    }
  };

  const handleSave = () => {
    if (binanceParams.ThiefSpreadBuyBps != 0 && binanceParams.ThiefSpreadBuyBps){
      binanceParams.ThiefOrder = true
    }
    const payload = {
      Type: "params",
      Data: binanceParams,
    };
    console.log(payload);

    sendMessage(payload);

    bybitParams.ThiefOrder = false
    const payload2 = {
      Type: "params",
      Data: bybitParams,
    };

    sendMessage(payload2);
  };
  const handleSaveContracts = () => {
    const payload = {
      Type: "contracts",
      Data: {
        Contracts: formData.Contracts,
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
    setPrices(false);
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
      <Box sx={{ padding: 4, maxWidth: 1500, margin: "0 auto" }}>
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

          <Button
            fullWidth
            style={{ alignSelf: "center", margin: "0 0 20px 0" }}
            onClick={() => setUpdateSocket(!updateSocket)}
          >
            Reconnect socket{" "}
          </Button>

          <FormControl fullWidth>
            <InputLabel id="SymbolId">Asset</InputLabel>
            <Select
              label="Symbol"
              labelId="SymbolId"
              name="Symbol"
              id="SymbolId"
              value={FormData.Symbol}
              onChange={handleChange}
              fullWidth
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
              fullWidth
              style={{ margin: "0 0 40px 0" }}
            >
              <MenuItem type="select" value={"buy"}>
                Buy
              </MenuItem>
              <MenuItem type="select" value={"sell"}>
                Sell
              </MenuItem>
              <MenuItem type="select" value={"both"}>
                Both
              </MenuItem>
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
              fullWidth
              style={{ margin: "0 0 40px 0" }}
            >
              <MenuItem type="select" value={true}>
                Enabled
              </MenuItem>
              <MenuItem type="select" value={false}>
                Disabled
              </MenuItem>
            </Select>
            <TextField
              style={{ margin: "0 0 40px 0" }}
              label="B3 Contracts Quantity"
              name="Contracts"
              type="text"
              value={formData.Contracts}
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
          </FormControl>
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
            }}
          >
            <div style={{ width: "48%" }}>
              <p
                style={{
                  textAlign: "center",
                  textTransform: "uppercase",
                  color: "#5c5c5c",
                }}
              >
                Binance
              </p>
              <TextField
                style={{ margin: "0 0 40px 0" }}
                label="Max Position(Dol)"
                name="MaxPosition"
                type="text"
                value={binanceParams.MaxPosition}
                onChange={handleChange}
                fullWidth
              />
              <TextField
                style={{ margin: "0 0 40px 0" }}
                label="Spread Buy (Bps)"
                name="SpreadBuyBps"
                type="text"
                value={binanceParams.SpreadBuyBps}
                onChange={handleChangeBinance}
                fullWidth
              />
              <TextField
                style={{ margin: "0 0 40px 0" }}
                label="Spread Sell (Bps)"
                name="SpreadSellBps"
                type="text"
                value={binanceParams.SpreadSellBps}
                onChange={handleChangeBinance}
                fullWidth
              />
              <TextField
                style={{ margin: "0 0 40px 0" }}
                label="Order Size (Buy $)"
                name="OrderSizeDolBuy"
                type="text"
                value={binanceParams.OrderSizeDolBuy}
                onChange={handleChangeBinance}
                fullWidth
              />
              <TextField
                style={{ margin: "0 0 40px 0" }}
                label="Order Size (Sell $)"
                name="OrderSizeDolSell"
                type="text"
                value={binanceParams.OrderSizeDolSell}
                onChange={handleChangeBinance}
                fullWidth
              />
              <TextField
                style={{ margin: "0 0 40px 0" }}
                label="Tolerance (Bps)"
                name="ToleranceBps"
                type="text"
                value={binanceParams.ToleranceBps}
                onChange={handleChangeBinance}
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
            </div>
            <div style={{ width: "48%" }}>
              <p
                style={{
                  textAlign: "center",
                  textTransform: "uppercase",
                  color: "#5c5c5c",
                }}
              >
                Bybit
              </p>
              <TextField
                style={{ margin: "0 0 40px 0" }}
                label="Max Position(Dol)"
                name="MaxPosition"
                type="text"
                value={bybitParams.MaxPosition}
                onChange={handleChange}
                fullWidth
              />
              <TextField
                style={{ margin: "0 0 40px 0" }}
                label="Spread Buy (Bps)"
                name="SpreadBuyBps"
                type="text"
                value={bybitParams.SpreadBuyBps}
                onChange={handleChangeBybit}
                fullWidth
              />
              <TextField
                style={{ margin: "0 0 40px 0" }}
                label="Spread Sell (Bps)"
                name="SpreadSellBps"
                type="text"
                value={bybitParams.SpreadSellBps}
                onChange={handleChangeBybit}
                fullWidth
              />
              <TextField
                style={{ margin: "0 0 40px 0" }}
                label="Order Size (Buy $)"
                name="OrderSizeDolBuy"
                type="text"
                value={bybitParams.OrderSizeDolBuy}
                onChange={handleChangeBybit}
                fullWidth
              />
              <TextField
                style={{ margin: "0 0 40px 0" }}
                label="Order Size (Sell $)"
                name="OrderSizeDolSell"
                type="text"
                value={bybitParams.OrderSizeDolSell}
                onChange={handleChangeBybit}
                fullWidth
              />
              <TextField
                style={{ margin: "0 0 40px 0" }}
                label="Tolerance (Bps)"
                name="ToleranceBps"
                type="text"
                value={bybitParams.ToleranceBps}
                onChange={handleChangeBybit}
                fullWidth
              />
            </div>
          </div>
          <Stack
            direction="row"
            spacing={3}
            justifyContent="center"
            marginTop={5}
          >
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

            <Button
              variant="contained"
              color="primary"
              onClick={handleSaveContracts}
            >
              Save contracts
            </Button>
          </Stack>
          <div>
            {prices && (
              <p style={{ color: "black" }}>
                Ask: {ask} , Bid: {bid} , Spread: {spread}{" "}
              </p>
            )}
          </div>
          <div>
            {prices && thiefOrder && (
              <p style={{ color: "black" }}>
                ThiefAsk: {thiefAsk} , ThiefBid: {thiefBid} ,
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
