import React, { useState } from "react";
import { LoadingOutlined } from "@ant-design/icons";
import { Input, Row, Col, Button, message, Tabs, Divider } from "antd";
import { usePageVisibility } from "react-page-visibility";
import { useCookies } from "react-cookie";
import ReactInterval from "react-interval";
import get from "lodash.get";
import axios from "axios";

import "antd/dist/antd.css";
import "./App.css";

const { TabPane } = Tabs;

const STASH_ITEM_API = "character-window/get-stash-items";
const API_FETCH_INTERVAL = 5000; // 5s
const STASH_CELL_SIZE = 48;

const fetchApi = (inputData = {}, setFetching, setFetchedData) => {
  const { accountName, league, POESESSID, tabIndices } = inputData;
  if (!accountName || !league || !POESESSID || !tabIndices) {
    message.error("Please fill in all details");
    setFetching(false);
    return;
  }

  const tabArray = tabIndices.split(",");
  if (tabArray.length <= 0) {
    message.error("Please separate Tab Indices using ','");
    setFetching(false);
    return;
  }

  const promises = tabArray.map(t => {
    return axios
      .get(`/api/${STASH_ITEM_API}`, {
        headers: {
          "poe-cookie": `POESESSID=${inputData.POESESSID};`
        },
        params: {
          accountName: inputData.accountName,
          league: inputData.league,
          tabs: 1,
          tabIndex: (t || "").trim()
        }
      })
      .then(res => ({ tab: t, data: res.data }));
  });

  axios.all(promises).then(values => {
    setFetchedData(Object.keys(values).map(k => values[k]));
  });
};

function App() {
  const isVisible = usePageVisibility();
  const [cookies, setCookie] = useCookies();
  const [inputData, setData] = useState(cookies);
  const [isFetching, setFetching] = useState(false);
  const [fetchedData, setFetchedData] = useState([]);

  console.log(fetchedData);

  return (
    <div className="app">
      <h1>Chaos Receipe Helper</h1>
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
          enabled
          callback={() => {
            if (isFetching && isVisible) {
              fetchApi(inputData, setFetching, setFetchedData);
            }
          }}
        />
      </div>
      <Tabs defaultActiveKey="1">
        {fetchedData.map(tabData => {
          const { tab, data = {} } = tabData;
          const { items = [] } = data;
          return (
            <TabPane tab={get(data, `tabs.${tab}.n`) || ""} key={tab}>
              <div
                className="stashGrid"
                style={{
                  width: STASH_CELL_SIZE * 12,
                  height: STASH_CELL_SIZE * 12
                }}
              >
                {items.map(i => (
                  <img
                    key={i.id}
                    src={i.icon}
                    style={{
                      position: "absolute",
                      top: (i.y || 0) * STASH_CELL_SIZE,
                      left: (i.x || 0) * STASH_CELL_SIZE,
                      width: (i.w || 1) * STASH_CELL_SIZE,
                      height: (i.h || 1) * STASH_CELL_SIZE
                    }}
                  />
                ))}
                {/* Horizontal Grid */}
                {[...new Array(11)].map((_, i) => (
                  <Divider
                    key={i}
                    style={{
                      position: "absolute",
                      left: 0,
                      top: (i + 1) * STASH_CELL_SIZE,
                      background: "#ccc",
                      margin: 0
                    }}
                  />
                ))}
                {/* Vertical Grid */}
                {[...new Array(11)].map((_, i) => (
                  <Divider
                    key={i}
                    type="vertical"
                    style={{
                      position: "absolute",
                      top: 0,
                      left: (i + 1) * STASH_CELL_SIZE,
                      background: "#ccc",
                      margin: 0,
                      height: "100%"
                    }}
                  />
                ))}
              </div>
            </TabPane>
          );
        })}
      </Tabs>
    </div>
  );
}

export default App;
