import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import AddTradeForm from "../components/AddTradeForm";

const Trades = () => {
  return (
    <>
      <Navbar />
      <div className="container">
        <h2>Add a New Trade</h2>
        <AddTradeForm />
      </div>
      <Footer />
    </>
  );
};

export default Trades;
