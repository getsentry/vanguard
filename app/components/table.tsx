import styled from "styled-components";

export const Table = styled.table`
  width: 100%;
  margin: 30px 0;

  thead th {
    border-bottom: 2px solid #eee;
  }

  th,
  td {
    padding: 5px;
    text-align: left;
  }
  th:first-child,
  td:first-child {
    text-align: left;
  }
`;

export default Table;
