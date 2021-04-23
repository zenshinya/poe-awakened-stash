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
const SET_TO_COMPLETE = 5;

const HIGHLIGHT_COLORS = ["red", "green", "blue", "yellow", "purple"];

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

const checkCompleted = data => {
  const itemMap = {
    oneH: [],
    twoH: [],
    head: [],
    body: [],
    glove: [],
    feet: [],
    belt: [],
    amulet: [],
    ring: []
  };

  data.forEach(d => {
    const { items } = d.data;
    items.forEach(i => {
      // Use icon to check type
      const { icon } = i;
      const { w, h, x, y, inventoryId } = i;
      const required = {
        w,
        h,
        x,
        y,
        stash: Number(inventoryId.replace("Stash", "")) - 1
      };
      if (
        icon.includes("/Weapons/OneHandWeapons/") ||
        icon.includes("/Armours/Shields/")
      ) {
        itemMap.oneH.push(required);
      } else if (icon.includes("/Weapons/TwoHandWeapons/")) {
        itemMap.twoH.push(required);
      } else if (icon.includes("/Armours/Helmets/")) {
        itemMap.head.push(required);
      } else if (icon.includes("/Armours/BodyArmours/")) {
        itemMap.body.push(required);
      } else if (icon.includes("/Armours/Gloves/")) {
        itemMap.glove.push(required);
      } else if (icon.includes("/Armours/Boots/")) {
        itemMap.feet.push(required);
      } else if (icon.includes("/Belts/")) {
        itemMap.belt.push(required);
      } else if (icon.includes("/Amulets/")) {
        itemMap.amulet.push(required);
      } else if (icon.includes("/Rings/")) {
        itemMap.ring.push(required);
      }
    });
  });

  const progressSets = JSON.parse(JSON.stringify(itemMap));
  const completedSets = [];
  while (
    (itemMap.oneH.length >= 2 || itemMap.twoH.length >= 1) &&
    itemMap.head.length >= 1 &&
    itemMap.body.length >= 1 &&
    itemMap.glove.length >= 1 &&
    itemMap.feet.length >= 1 &&
    itemMap.belt.length >= 1 &&
    itemMap.amulet.length >= 1 &&
    itemMap.ring.length >= 2
  ) {
    const newSet = [];
    newSet.push(itemMap.head.shift());
    newSet.push(itemMap.body.shift());
    newSet.push(itemMap.glove.shift());
    newSet.push(itemMap.feet.shift());
    newSet.push(itemMap.belt.shift());
    newSet.push(itemMap.amulet.shift());
    newSet.push(itemMap.ring.shift());
    newSet.push(itemMap.ring.shift());
    if (itemMap.oneH.length >= 2) {
      newSet.push(itemMap.oneH.shift());
      newSet.push(itemMap.oneH.shift());
    } else if (itemMap.twoH.length >= 1) {
      newSet.push(itemMap.twoH.shift());
    }

    completedSets.push(newSet);
  }

  return { progressSets, completedSets };
};

function App() {
  const isVisible = usePageVisibility();
  const [cookies, setCookie] = useCookies();
  const [inputData, setData] = useState(cookies);
  const [isFetching, setFetching] = useState(false);
  const [fetchedData, setFetchedData] = useState([]);

  const progressDetails = checkCompleted(fetchedData);

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
      <Row gutter={12}>
        <Col span={6}>
          <div className="progress">
            <h2>Progress</h2>
            {(() => {
              const c = [];
              if (
                Math.floor(progressDetails.progressSets.oneH.length / 2) +
                  progressDetails.progressSets.twoH.length <
                SET_TO_COMPLETE
              ) {
                c.push(
                  <div
                    key="more-oneH"
                    style={{ color: "red" }}
                  >{`1H Weap: ${SET_TO_COMPLETE * 2 -
                    progressDetails.progressSets.oneH.length -
                    progressDetails.progressSets.twoH.length * 2} more`}</div>
                );
                c.push(
                  <div
                    key="more-twoH"
                    style={{ color: "red" }}
                  >{`2H Weap: ${SET_TO_COMPLETE -
                    Math.floor(progressDetails.progressSets.oneH.length / 2) -
                    progressDetails.progressSets.twoH.length} more`}</div>
                );
              }
              if (progressDetails.progressSets.head.length < SET_TO_COMPLETE) {
                c.push(
                  <div
                    key="more-head"
                    style={{ color: "red" }}
                  >{`Head: ${SET_TO_COMPLETE -
                    progressDetails.progressSets.head.length} more`}</div>
                );
              }
              if (progressDetails.progressSets.body.length < SET_TO_COMPLETE) {
                c.push(
                  <div
                    key="more-body"
                    style={{ color: "red" }}
                  >{`Body: ${SET_TO_COMPLETE -
                    progressDetails.progressSets.body.length} more`}</div>
                );
              }
              if (progressDetails.progressSets.glove.length < SET_TO_COMPLETE) {
                c.push(
                  <div
                    key="more-glove"
                    style={{ color: "red" }}
                  >{`Glove: ${SET_TO_COMPLETE -
                    progressDetails.progressSets.glove.length} more`}</div>
                );
              }
              if (progressDetails.progressSets.feet.length < SET_TO_COMPLETE) {
                c.push(
                  <div
                    key="more-feet"
                    style={{ color: "red" }}
                  >{`Feet: ${SET_TO_COMPLETE -
                    progressDetails.progressSets.feet.length} more`}</div>
                );
              }
              if (progressDetails.progressSets.belt.length < SET_TO_COMPLETE) {
                c.push(
                  <div
                    key="more-belt"
                    style={{ color: "red" }}
                  >{`Belt: ${SET_TO_COMPLETE -
                    progressDetails.progressSets.belt.length} more`}</div>
                );
              }
              if (
                progressDetails.progressSets.amulet.length < SET_TO_COMPLETE
              ) {
                c.push(
                  <div
                    key="more-amulet"
                    style={{ color: "red" }}
                  >{`Amulet: ${SET_TO_COMPLETE -
                    progressDetails.progressSets.amulet.length} more`}</div>
                );
              }
              if (
                progressDetails.progressSets.ring.length <
                SET_TO_COMPLETE * 2
              ) {
                c.push(
                  <div
                    key="more-ring"
                    style={{ color: "red" }}
                  >{`Ring: ${SET_TO_COMPLETE * 2 -
                    progressDetails.progressSets.ring.length} more`}</div>
                );
              }
              return c;
            })()}
            <Divider />
            <div>
              <strong>{`Completed Sets: ${progressDetails.completedSets.length}`}</strong>
            </div>
            <div>{`1H Weap: ${progressDetails.progressSets.oneH.length}`}</div>
            <div>{`2H Weap: ${progressDetails.progressSets.twoH.length}`}</div>
            <div>{`Head: ${progressDetails.progressSets.head.length}`}</div>
            <div>{`Body: ${progressDetails.progressSets.body.length}`}</div>
            <div>{`Glove: ${progressDetails.progressSets.glove.length}`}</div>
            <div>{`Feet: ${progressDetails.progressSets.feet.length}`}</div>
            <div>{`Belt: ${progressDetails.progressSets.belt.length}`}</div>
            <div>{`Amulet: ${progressDetails.progressSets.amulet.length}`}</div>
            <div>{`Ring: ${progressDetails.progressSets.ring.length}`}</div>
          </div>
        </Col>
        <Col span={18}>
          <Tabs>
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
                    {(() => {
                      const highlights = [];
                      progressDetails.completedSets.forEach((cs, csi) => {
                        cs.forEach(zone => {
                          if (zone.stash === Number(tab))
                            highlights.push(
                              <div
                                style={{
                                  position: "absolute",
                                  background: HIGHLIGHT_COLORS[csi] || "black",
                                  opacity: 0.3,
                                  width: zone.w * STASH_CELL_SIZE,
                                  height: zone.h * STASH_CELL_SIZE,
                                  top: zone.y * STASH_CELL_SIZE,
                                  left: zone.x * STASH_CELL_SIZE
                                }}
                              />
                            );
                        });
                      });
                      return highlights;
                    })()}
                  </div>
                </TabPane>
              );
            })}
          </Tabs>
        </Col>
      </Row>
    </div>
  );
}

export default App;
