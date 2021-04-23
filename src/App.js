import React, { useState } from "react";
import { LoadingOutlined } from "@ant-design/icons";
import { Input, Row, Col, Button } from "antd";
import { useCookies } from "react-cookie";
import ReactInterval from "react-interval";
import axios from "axios";

import "antd/dist/antd.css";
import "./App.css";

const STASH_ITEM_API = "character-window/get-stash-items";
const API_FETCH_INTERVAL = 3000; // 3s

const fetchApi = inputData => {
  axios
    .get(`/api/${STASH_ITEM_API}`, {
      headers: {
        "poe-cookie": `POESESSID=${inputData.POESESSID};`
      },
      params: {
        accountName: inputData.accountName,
        league: inputData.league,
        tabs: 0,
        tabIndex: inputData.tabIndices // TODO:
      }
    })
    .then(res => {
      console.log(res.data);
    });
};

function App() {
  const [cookies, setCookie] = useCookies();
  const [inputData, setData] = useState(cookies);
  const [isFetching, setFetching] = useState(false);
  const [fetchInterval, setFetchInterval] = useState();

  return (
    <div className="app">
      <div>
        <Row gutter={[12, 12]}>
          <Col span={12}>
            <Input
              defaultValue={cookies.accountName}
              addonBefore={<div>Account Name</div>}
              onChange={e => {
                setCookie("accountName", e.target.value);
                setData(d => ({
                  ...d,
                  accountName: e.target.value
                }));
              }}
            />
          </Col>
          <Col span={12}>
            <Input
              defaultValue={cookies.league}
              addonBefore={<div>League</div>}
              onChange={e => {
                setCookie("league", e.target.value);
                setData(d => ({
                  ...d,
                  league: e.target.value
                }));
              }}
            />
          </Col>
          <Col span={12}>
            <Input.Password
              defaultValue={cookies.POESESSID}
              addonBefore={<div>POE SESSION ID</div>}
              onChange={e => {
                setCookie("POESESSID", e.target.value);
                setData(d => ({
                  ...d,
                  POESESSID: e.target.value
                }));
              }}
            />
          </Col>
          <Col span={12}>
            <Input
              defaultValue={cookies.tabIndices}
              addonBefore={<div>Tab Indices</div>}
              onChange={e => {
                setCookie("tabIndices", e.target.value);
                setData(d => ({
                  ...d,
                  tabIndices: e.target.value
                }));
              }}
            />
          </Col>
        </Row>
      </div>
      <div className="startContainer">
        <Button
          style={{ width: 200 }}
          type="primary"
          icon={isFetching ? <LoadingOutlined spin /> : null}
          ghost={isFetching}
          onClick={() => {
            if (isFetching) {
              setFetching(false);
            } else {
              setFetching(true);
            }
          }}
        >
          {isFetching ? "Stop Fetching" : "Start Fetching"}
        </Button>
        <ReactInterval
          timeout={API_FETCH_INTERVAL}
          enabled={isFetching}
          callback={() => {
            fetchApi(inputData);
          }}
        />
      </div>
    </div>
  );
}

export default App;
