import Layout from "@app/components/layout";
import React from "react";
import css from "styled-jsx/css";
import moment from "moment";
import {
  ResponsiveContainer,
  LineChart,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Line,
} from "recharts";
import { DatePicker, Select } from "antd";
import { BASE_URL, GET, POST } from "@app/request";
import { FormatNumber } from "@app/utils/fotmat-number";
import { convertMoney } from "@app/utils";
import {
  CustomizedXTickPack,
  CustomizedYTickBoost,
  CustomTooltip,
} from "@app/components/core/charts";
import AreaChart from "@app/components/core/area-chart";

const styles = css.global`
  .custom-tooltip {
    width: 100px;
    height: fit-content;
    border-radius: 4px;
    padding: 6px;
    background-color: #424242;
    &__title {
      font-size: 9px;
      line-height: 1.56;
      letter-spacing: 1.35px;
      color: #9e9e9e;
    }
    &__content {
      font-size: 13px;
      font-weight: 600;
      line-height: 1.38;
      letter-spacing: 0.3px;
      color: #ffffff;
    }
  }
`;

const COLORS = ["#89d34f", "#714fff", "#ff2e93"];

const RADIAN = Math.PI / 180;

const renderCustomizedLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
  index,
}) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return percent * 100 > 10 ? (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  ) : (
    ""
  );
};

const renderLegend = (props) => {
  const { payload } = props;

  return (
    <ul className="flex items-center justify-center w-full mt-3">
      {payload.map((entry, index) => {
        return (
          <li
            key={`item-${index}`}
            className={index < payload.length ? "mr-10" : ""}
          >
            <div className="flex items-center">
              <div
                style={{
                  width: 10,
                  height: 10,
                  background: entry?.color,
                  borderRadius: 10,
                }}
              ></div>
              <div className="ml-3">{entry?.payload?.name}</div>
            </div>
          </li>
        );
      })}
    </ul>
  );
};

const RenderLegendBoost = (props) => {
  const { data = [] } = props;

  return (
    <ul className="flex items-center justify-center w-full mt-3">
      {data.map((entry, index) => {
        return (
          <li key={`item-${index}`} className={"mr-10"}>
            <div className="flex items-center">
              <div
                style={{
                  width: 10,
                  height: 10,
                  background: entry?.color,
                  borderRadius: 10,
                }}
              />
              <div className="ml-3">{entry?.name}</div>
            </div>
          </li>
        );
      })}
    </ul>
  );
};

const CustomizedXTickBoost = ({
  x,
  y,
  textAnchor,
  fill,
  payload: { value },
  ...props
}) => {
  let data = convertMoney(value);

  return (
    <text
      x={x}
      y={y + 10}
      style={{
        fontSize: 9,
        color: "#2a2a2c",
        lineHeight: 1.56,
        letterSpacing: 1.35,
      }}
      fill={fill}
      textAnchor={textAnchor}
    >
      {data}
    </text>
  );
};

const CustomizedShapeBoost = ({ x, y, width, height, color }) => {
  return (
    <g>
      <rect fill={color} x={x} y={y} width={width} height={height} />
    </g>
  );
};

const Index = () => {
  const [filterPackage, changeFilterPackage] = React.useState(undefined);
  const [filterBoost, changeFilterBoost] = React.useState(undefined);
  const [currentMonth, setMonth] = React.useState(undefined);
  const [dashboardData, setDashBoardData] = React.useState({});
  const [boostUsedByRanging, setBoostUsedByRanging] = React.useState([]);
  const [packsBoughtByYear, setPacksBoughtByYear] = React.useState([]);
  const [activeUsersByMonth, setActiveUsersByMonth] = React.useState([]);
  const [oss, setOs] = React.useState([]);
  const [packages, setPackage] = React.useState([]);
  const [boosts, setBoost] = React.useState([]);

  React.useEffect(() => {}, []);

  React.useEffect(() => {
    getActivityUserByMonth();
  }, [currentMonth]);

  React.useEffect(() => {
    if (filterBoost) {
      console.log({ filterBoost });
      getBoostByYear();
    }
  }, [filterBoost]);
  
  React.useEffect(() => {
    if (filterPackage) {
      getPackageByYear();
    }
  }, [filterPackage]);

  React.useEffect(() => {
    (async () => {
      const { data: dbRes } = await POST(`/admin/dashboard/overview`);

      if (dbRes?.data) {
        setDashBoardData(dbRes?.data);
      }

      const { data: osRes } = await GET(
        `${BASE_URL}instagram/admin/data/os.json`
      );
      if (osRes) {
        setOs(osRes);
      }

      const { data: packs } = await POST(`/admin/getPackage`);
      if (packs?.data?.rows) {
        setPackage(packs?.data?.rows);
        changeFilterPackage({
          year: moment().year(),
          packageId: packs?.data?.rows?.[0]?.packageId,
        });
      }

      const { data: boosts } = await POST(`/admin/getBoost`);
      if (boosts?.data && boosts?.data?.length > 0) {
        setBoost(boosts?.data);
        console.log(boosts?.data?.[0]?.id);
        changeFilterBoost({
          year: moment().year(),
          boostId: boosts?.data?.[0]?.id,
        });
      }

      onChangeMonth();
    })();
  }, []);

  const onChangeFilterBoost = (e) => {
    changeFilterBoost({
      ...filterBoost,
      year: moment(e).year(),
    });
  };

  const onChangeYear = (e) => {
    changeFilterPackage({
      ...filterPackage,
      year: moment(e).year(),
    });
  };

  const onChangeMonth = (e) => {
    setMonth({
      month: moment(e).month() + 1,
      year: moment(e).year(),
    });
  };

  const getActivityUserByMonth = async () => {
    const { data: activeUsersRes } = await POST(
      `/admin/charts/activityByMonth?date=01-${currentMonth?.month}-${currentMonth?.year}`,
      {}
    );
    if (activeUsersRes?.data) {
      setActiveUsersByMonth(activeUsersRes?.data);
    }
  };

  const getBoostByYear = async () => {
    if (filterBoost?.boostId && filterBoost?.year) {
      const { data: activeUsersRes } = await POST(
        `/admin/charts/boostByYear?date=01-01-${filterBoost?.year}`,
        {
          boostId: filterBoost?.boostId,
          date: `01-01-${filterBoost?.year}`,
        }
      );
      if (activeUsersRes?.data) {
        setBoostUsedByRanging(activeUsersRes?.data);
      }
    }
  };

  const getPackageByYear = async () => {
    if (filterPackage?.packageId && filterPackage?.year) {
      const { data: activeUsersRes } = await POST(
        `/admin/charts/packageBoughtByYear?date=01-01-${filterPackage?.year}`,
        {
          packageId: filterPackage?.packageId,
          date: `01-01-${filterPackage?.year}`,
        }
      );
      if (activeUsersRes?.data) {
        setPacksBoughtByYear(activeUsersRes?.data);
      }
    }
  };

  return (
    <Layout title="Home">
      <div className="flex">
        <div className="core-card flex-1 mr-4 h-24">
          <div className="pa-10 uppercase second-text-color">
            total of users
          </div>
          <div className="title-2 uppercase text-black mt-2">
            {FormatNumber("#.##0,##", dashboardData?.amountUser || 0)}
          </div>
        </div>
        <div className="core-card flex-1 mr-4 h-24">
          <div className="pa-10 uppercase second-text-color">
            today boosts used
          </div>
          <div className="title-2 uppercase text-black mt-2">
            {FormatNumber("#.##0,##", dashboardData?.amountTodayUser || 0)}
          </div>
        </div>
        <div className="core-card flex-1 mr-4 h-24">
          <div className="pa-10 uppercase second-text-color">
            today packs bought
          </div>
          <div className="title-2 uppercase text-black mt-2">
            {FormatNumber("#.##0,##", dashboardData?.amountTodayBought || 0)}
          </div>
        </div>
        <div className="core-card flex-1 h-24 mr-4">
          <div className="pa-10 uppercase second-text-color">
            total of packs bought
          </div>
          <div className="title-2 uppercase text-black mt-2">
            {FormatNumber("#.##0,##", dashboardData?.amountTotalBought || 0)}
          </div>
        </div>
        <div className="core-card flex-1 h-24 mr-4">
          <div className="pa-10 uppercase second-text-color">today revenue</div>
          <div className="title-2 uppercase text-black mt-2">
            ${FormatNumber("#.##0,##", dashboardData?.amountTodayRevenue || 0)}
          </div>
        </div>
        <div className="core-card flex-1 h-24">
          <div className="pa-10 uppercase second-text-color">
            total of revenue
          </div>
          <div className="title-2 uppercase text-black mt-2">
            ${FormatNumber("#.##0,##", dashboardData?.amountTotalRevenue || 0)}
          </div>
        </div>
      </div>
      <div className="flex flex-wrap -mx-4">
        <div className="p-4 w-1/2">
          <div className="core-card w-full p-8" style={{ maxHeight: 400 }}>
            <div className="flex items-center justify-between  mb-4">
              <div className="font-bold pa-14 text-black">
                Packs Bought By Year ($)
              </div>
              <div className="flex-1 flex justify-end ml-10">
                {/* <Select className="w-32 mr-4" placeholder="Select OS">
                  {oss?.map((os) => (
                    <Select.Option key={os?.code} value={os?.code}>
                      {os?.name}
                    </Select.Option>
                  ))}
                </Select> */}
                <Select
                  value={filterPackage?.packageId}
                  onChange={(e) => {
                    changeFilterPackage({
                      ...filterPackage,
                      packageId: e,
                    });
                  }}
                  className="w-32 mr-4"
                  placeholder="Select Pack"
                >
                  {packages?.map((pack) => (
                    <Select.Option
                      key={pack?.packageId}
                      value={pack?.packageId}
                    >
                      {pack?.packageName}
                    </Select.Option>
                  ))}
                </Select>
                <DatePicker
                  className="w-20"
                  allowClear={false}
                  picker="year"
                  value={moment(`01-01-${filterPackage?.year}`, "DD-MM-YYYY")}
                  onChange={onChangeYear}
                />
              </div>
            </div>
            <div style={{ width: "100%", height: 300 }} className="flex-1">
              <ResponsiveContainer>
              <ResponsiveContainer>
                <LineChart
                  isAnimationActive={false}
                  data={packsBoughtByYear}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={<CustomizedXTickPack />} />
                  <YAxis  />
                  { packsBoughtByYear?.length > 0 && <Tooltip content={<CustomTooltip/>}/> }
                  {/* <Legend content={renderLegend}/> */}
                  <Line dataKey="value" stackId="a" fill="#ff2e93" />
                </LineChart>
              </ResponsiveContainer>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        <div className="p-4 w-1/2">
          <div className="core-card w-full p-8" style={{ maxHeight: 400 }}>
            <div className="flex items-center justify-between  mb-4">
              <div className="font-bold pa-14 text-black">
                Boost Used By Year (k)
              </div>
              <div className="flex-1 flex justify-end ml-10">
                <Select
                  value={filterBoost?.boostId}
                  className="w-24 mr-4"
                  onChange={(a) => {
                    changeFilterBoost({
                      ...filterBoost,
                      boostId: a,
                    });
                  }}
                  placeholder="Select Boost stars"
                >
                  {boosts
                    ?.sort((a, b) => a.boostStar - b.boostStar)
                    .map((boost) => (
                      <Select.Option key={boost?._id} value={boost?._id}>
                        {boost?.boostStar} ⭐
                      </Select.Option>
                    ))}
                </Select>
                <DatePicker
                  className="w-20"
                  allowClear={false}
                  picker="year"
                  value={moment(`01-01-${filterBoost?.year}`, "DD-MM-YYYY")}
                  onChange={onChangeFilterBoost}
                />
              </div>
            </div>
            <div style={{ width: "100%", height: 300 }} className="flex-1">
              <ResponsiveContainer>
                <LineChart
                  isAnimationActive={false}
                  data={boostUsedByRanging}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={<CustomizedXTickPack />} />
                  <YAxis  />
                  { packsBoughtByYear?.length > 0 && <Tooltip content={<CustomTooltip/>}/> }
                  {/* <Legend content={renderLegend}/> */}
                  <Line dataKey="value" stackId="a" fill="#ff2e93" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap">
        <div className="core-card w-full p-8" style={{ maxHeight: 400 }}>
          <div className="flex items-center justify-between  mb-4">
            <div className="font-bold pa-14 text-black">
              Active Users by Month
            </div>
            <DatePicker
              value={moment(
                `01-${
                  currentMonth?.month < 10
                    ? "0" + currentMonth?.month
                    : currentMonth?.month
                }-${currentMonth?.year}`,
                "DD-MM-YYYY"
              )}
              allowClear={false}
              picker="month"
              onChange={onChangeMonth}
            />
          </div>
          <AreaChart data={activeUsersByMonth} />
        </div>
      </div>
      <style jsx>{styles}</style>
    </Layout>
  );
};

export default Index;
